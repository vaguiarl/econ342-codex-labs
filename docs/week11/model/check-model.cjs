#!/usr/bin/env node
'use strict';
// No packages required. Run from any directory; --write-results refreshes the audited artifact.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const modelDir = __dirname;
const modelFile = path.join(modelDir, 'model.js');
const model = require(modelFile);
const checks = [];
const near = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) <= tolerance,
  `${a} differs from ${b} by ${Math.abs(a-b)} (tolerance ${tolerance})`);
const sum = xs => xs.reduce((a,b) => a+b,0);

function checkEquilibrium(s, labor) {
  assert.equal(s.diagnostics.converged, true);
  assert.ok(s.diagnostics.maxRelativeMarketError < 1e-8);
  for (const values of [s.wages,s.income,s.priceIndex,s.realIncome,...s.shares,...s.tradeFlows])
    assert.ok(values.every(v => Number.isFinite(v) && v > 0));
  for (let j=0;j<labor.length;j++) {
    near(sum(s.shares.map(row => row[j])),1,1e-12);
    near(sum(s.tradeFlows.map(row => row[j])),s.income[j],1e-10);
    near(sum(s.tradeFlows[j])/s.income[j],1,1e-8);
    near(s.wages[j]*labor[j],s.income[j],1e-10);
  }
  near(sum(s.income),s.diagnostics.targetWorldIncome,1e-10);
}

const base=model.run();
const labor=base.regions.map(r=>r.labor);
checkEquilibrium(base.off,labor);checkEquilibrium(base.on,labor);
// Historical input reconciliation: the JavaScript's two changed links must match the teaching CSV.
const rows=fs.readFileSync(path.join(modelDir,'../data/historical_route_comparisons.csv'),'utf8')
  .trim().split(/\r?\n/).slice(1).map(line=>line.split(','));
for(const [destination,index] of [['San Francisco',1],['Yokohama',2]]) {
  const row=rows.find(r=>r[0]===destination);assert.ok(row);
  near(base.off.distances[0][index],Number(row[2]),0);
  near(base.on.distances[0][index],Number(row[3]),0);
}
checks.push('Historical changed links match source CSV');

// Two-region symmetric economy: wages=1 and CES index has a closed form.
const symmetric=model.solve({labor:[1,1],distances:[[0,7000],[7000,0]],theta:4,freight:0.2});
const tau=1.14, diagonalShare=1/(1+tau**-4), price=((1+tau**-4)/2)**(-1/4);
for(let i=0;i<2;i++) {
  near(symmetric.wages[i],1,1e-12);near(symmetric.domesticShares[i],diagonalShare,1e-12);
  near(symmetric.priceIndex[i],price,1e-12);
}
checks.push('Analytical symmetric two-region equilibrium');

// Unequal-labor frictionless benchmark: w_i proportional to L_i^(-1/sigma).
const matched=model.run({theta:4,freight:0});
const unscaled=labor.map(L=>L**(-1/5));
const normalization=sum(labor)/sum(unscaled.map((w,i)=>w*labor[i]));
for(let i=0;i<3;i++) {
  near(matched.off.wages[i],normalization*unscaled[i],1e-10);
  near(matched.changes.realIncomePct[i],0,1e-12);
  for(let j=0;j<3;j++)near(matched.off.shares[i][j],matched.on.shares[i][j],1e-12);
}
checks.push('Analytical unequal-labor frictionless wages and zero-freight matched cases');

for(const scenario of ['off','on']) {
  const s=base[scenario];
  const scaled=model.solve({labor,distances:s.distances,theta:4,freight:0.2,worldIncome:60});
  const permutation=[2,0,1];
  const permuted=model.solve({labor:permutation.map(i=>labor[i]),
    distances:permutation.map(i=>permutation.map(j=>s.distances[i][j])),theta:4,freight:0.2});
  for(let i=0;i<3;i++) {
    near(scaled.wages[i],10*s.wages[i],1e-9);
    near(scaled.priceIndex[i],10*s.priceIndex[i],1e-9);
    near(scaled.realIncome[i],s.realIncome[i],1e-10);
    near(permuted.wages[i],s.wages[permutation[i]],1e-10);
    for(let j=0;j<3;j++) {
      near(scaled.shares[i][j],s.shares[i][j],1e-10);
      near(permuted.shares[i][j],s.shares[permutation[i]][permutation[j]],1e-10);
    }
  }
}
checks.push('Numeraire invariance and region permutation invariance');

// Independent numerical method: Python finite-difference Newton root solve in relative log wages.
// It uses raw CES powers, solves two equations, and fixes the third relative wage, unlike JS iteration.
const python=String.raw`
import json, math, sys
payload=json.load(sys.stdin)
L=payload['labor']; theta=4; freight=.2
def solve(distances):
    def evaluate(z):
        w=[math.exp(z[0]),math.exp(z[1]),1.]
        scale=sum(L)/sum(w[i]*L[i] for i in range(3)); w=[x*scale for x in w]
        income=[w[i]*L[i] for i in range(3)]
        v=[[(w[i]*(1+freight*distances[i][j]/10000))**(-theta) for j in range(3)] for i in range(3)]
        den=[sum(v[i][j] for i in range(3)) for j in range(3)]
        shares=[[v[i][j]/den[j] for j in range(3)] for i in range(3)]
        rev=[sum(shares[i][j]*income[j] for j in range(3)) for i in range(3)]
        residual=[math.log(rev[i]/income[i]) for i in range(2)]
        return residual, {'wages':w,'shares':shares,'priceIndex':[(x/3)**(-1/theta) for x in den]}
    z=[0.,0.]
    for _ in range(100):
        r,out=evaluate(z)
        if max(map(abs,r))<1e-13:return out
        h=1e-6
        columns=[]
        for k in range(2):
            trial=z.copy(); trial[k]+=h
            rr,_=evaluate(trial);columns.append([(rr[i]-r[i])/h for i in range(2)])
        a,c=columns[0];b,d=columns[1];det=a*d-b*c
        step=[(d*r[0]-b*r[1])/det,(-c*r[0]+a*r[1])/det]
        alpha=1.
        while alpha>1e-8:
            trial=[z[i]-alpha*step[i] for i in range(2)]
            rr,_=evaluate(trial)
            if max(map(abs,rr))<max(map(abs,r)):z=trial;break
            alpha*=.5
        else:raise RuntimeError('Independent Newton line search failed')
    raise RuntimeError('Independent Newton did not converge')
print(json.dumps([solve(d) for d in payload['distances']]))
`;
const independent=spawnSync('python3',['-c',python],{
  input:JSON.stringify({labor,distances:[base.off.distances,base.on.distances]}),encoding:'utf8'});
assert.equal(independent.status,0,independent.stderr || String(independent.error));
JSON.parse(independent.stdout).forEach((s,k)=>{
  const original=base[k===0?'off':'on'];
  for(let i=0;i<3;i++) {
    near(s.wages[i],original.wages[i],1e-9);near(s.priceIndex[i],original.priceIndex[i],1e-9);
    for(let j=0;j<3;j++)near(s.shares[i][j],original.shares[i][j],1e-9);
  }
});
checks.push('Independent Python Newton solver agrees with default equilibria');

let gridCases=0, maximumError=0, maximumIterations=0;
for(let ti=0;ti<=24;ti++)for(let fi=0;fi<=50;fi++) {
  const r=model.run({theta:2+ti/4,freight:fi/100});
  for(const s of [r.off,r.on]) {
    checkEquilibrium(s,labor);
    maximumError=Math.max(maximumError,s.diagnostics.maxRelativeMarketError);
    maximumIterations=Math.max(maximumIterations,s.diagnostics.iterations);
  }
  gridCases++;
}
checks.push('Dense UI parameter grid: 1275 parameter pairs, 2550 equilibria');

for(const bad of [{theta:1},{theta:9},{theta:NaN},{freight:-.1},{freight:.6},{freight:Infinity}])
  assert.throws(()=>model.run(bad),RangeError);
assert.throws(()=>model.solve({labor:[1,0],distances:[[0,1],[1,0]]}),RangeError);
assert.throws(()=>model.solve({labor:[1,1],distances:[[1,1],[1,0]]}),RangeError);
checks.push('Invalid inputs fail explicitly');

const browser={};vm.createContext(browser);vm.runInContext(fs.readFileSync(modelFile,'utf8'),browser);
const browserResult=browser.PanamaModel.run();
base.changes.realIncomePct.forEach((v,i)=>near(v,browserResult.changes.realIncomePct[i],1e-12));
// Stable default reference, independently verified above; catches accidental future contract changes.
[4.218236060607672,4.430240216463388,0.46753496167184494]
  .forEach((v,i)=>near(base.changes.realIncomePct[i],v,1e-8));
checks.push('Browser-global and CommonJS interfaces agree; default reference unchanged');

const validation={status:'passed',modelVersion:model.version,
  modelSha256:crypto.createHash('sha256').update(fs.readFileSync(modelFile)).digest('hex'),
  gridCases,equilibriaCheckedOnGrid:2*gridCases,maximumMarketError:maximumError,
  maximumIterations,checks,
  scope:'Numerical and implementation checks only; no historical calibration, replication, or causal validation.'};
if(process.argv.includes('--write-results')) {
  const sensitivity=[];
  for(const theta of [2,3,4,5,6,7,8])for(const freight of [0,.1,.2,.3,.4,.5]) {
    const r=model.run({theta,freight});sensitivity.push({theta,freight,changes:r.changes,diagnostics:r.diagnostics});
  }
  fs.writeFileSync(path.join(modelDir,'model-results.json'),JSON.stringify({
    default:base,sensitivity,matchedCase:{description:'Zero freight: canal-on and canal-off economies are identical',result:matched},validation
  },null,2)+'\n');
}
console.log(JSON.stringify(validation,null,2));
