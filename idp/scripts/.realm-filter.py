import sys
import json
ifn = sys.argv[1]
rn = sys.argv[2]
ofn = sys.argv[3]
print("filtering out realm '{0}' from '{1}' to '{2}'".format(rn, ifn, ofn))
with open(ifn, 'r') as f:
    data = json.load(f)
idx = [ k for (k,v) in enumerate(data) if v['id'] == rn ]
assert len(idx) == 1, "realm not found!"
data = data[idx[0]]
with open(ofn, 'w') as f:
    json.dump(data, f)
print("done exporting realm configuration")
