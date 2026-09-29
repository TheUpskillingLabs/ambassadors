import csv, math, collections, json
geo={}; county={}; place={}
with open('pl/ncgeo2020.pl', encoding='latin-1') as f:
    for line in f:
        p=line.rstrip('\n').split('|')
        s=p[2]
        if s=='750': geo[p[7]]=p[9]
        elif s=='050': county[p[9]]=(p[7],p[87])
        elif s=='160': place[p[9]]=(p[7],p[87])
pop={}
with open('pl/nc000012020.pl', encoding='latin-1') as f:
    for line in f:
        p=line.split('|'); pop[p[4]]=int(p[5])
bpop={geo[l]:pop[l] for l in geo}
cpop={g:pop[l] for g,(l,n) in county.items()}
cname={g:n for g,(l,n) in county.items()}
ppop={g:pop[l] for g,(l,n) in place.items()}
pname={g:n for g,(l,n) in place.items()}
print('blocks',len(bpop),'total pop',sum(bpop.values()))
bplace={}
with open('baf/BlockAssign_ST37_NC_INCPLACE_CDP.txt') as f:
    next(f)
    for line in f:
        b,pl=line.rstrip('\n').split('|')
        if pl: bplace[b]='37'+pl
plans={'CD2025':'cd2025/SL 2025-95.csv','CD2023':'cd2023/SL 2023-145.csv','SEN2023':'senate2023/SL 2023-146_QC.csv','HOU2023':'house2023/SL 2023-149.csv'}
ideal={'CD2025':10439388/14,'CD2023':10439388/14,'SEN2023':10439388/50,'HOU2023':10439388/120}
res={}
for k,fn in plans.items():
    bd={}
    with open(fn, encoding='utf-8-sig') as f:
        r=csv.reader(f); next(r)
        for b,d in r: bd[b]=d
    missing=[b for b in bpop if b not in bd]
    cd=collections.defaultdict(lambda: collections.defaultdict(int))
    pd_=collections.defaultdict(lambda: collections.defaultdict(int))
    for b,d in bd.items():
        c=b[:5]; cd[c][d]+=bpop.get(b,0)
        if b in bplace: pd_[bplace[b]][d]+=bpop.get(b,0)
    res[k]={'county':{c:dict(v) for c,v in cd.items()},'place':{p:dict(v) for p,v in pd_.items()},'missing':len(missing)}
    print(k,'blocks assigned',len(bd),'blocks with pop but unassigned',len(missing))
    # check district pops
    dp=collections.defaultdict(int)
    for b,d in bd.items(): dp[d]+=bpop.get(b,0)
    print(k,'district pop min/max',min(dp.values()),max(dp.values()),'ideal',round(ideal[k],1))
out=[]
def row(kind,g,name,P):
    r={'kind':kind,'geoid':g,'name':name,'pop':P}
    for k in plans:
        dd=res[k][kind].get(g,{})
        n_any=len(dd); n_pop=sum(1 for v in dd.values() if v>0)
        n_1pct=sum(1 for v in dd.values() if v>=0.01*P)
        mn=math.ceil(P/ideal[k])
        r[k]={'districts_anyblock':n_any,'districts_withpop':n_pop,'districts_ge1pct':n_1pct,'min':mn,'excess':n_pop-mn,'shares':{d:round(v/P*100,1) for d,v in sorted(dd.items(),key=lambda x:-x[1])}}
    return r
for g,P in cpop.items():
    if P>150000: out.append(row('county',g,cname[g],P))
for g,P in ppop.items():
    if P>75000: out.append(row('place',g,pname[g],P))
def key(r): return (-r['CD2025']['excess'], -(r['SEN2023']['excess']+r['HOU2023']['excess']), -r['pop'])
out.sort(key=key)
json.dump(out,open('splits.json','w'),indent=1)
print()
print(f"{'kind':6} {'name':28} {'pop':>9} | CD25 n/min/x | CD23 n/min/x | SEN n/min/x | HOU n/min/x")
for r in out:
    f=lambda k: f"{r[k]['districts_withpop']}/{r[k]['min']}/{r[k]['excess']:+d}"
    print(f"{r['kind']:6} {r['name'][:28]:28} {r['pop']:>9} | {f('CD2025'):12} | {f('CD2023'):12} | {f('SEN2023'):11} | {f('HOU2023'):11}")
