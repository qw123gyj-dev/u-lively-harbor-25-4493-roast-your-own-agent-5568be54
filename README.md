[![make.fun](https://make.fun/badge/u-lively-harbor-25-4493-roast-your-own-agent-5568be54.svg)](https://make.fun/bounty/u-lively-harbor-25-4493-roast-your-own-agent-5568be54?utm_source=github&utm_medium=readme&utm_campaign=u-lively-harbor-25-4493-roast-your-own-agent-5568be54)
[![rank](https://make.fun/badge/u-lively-harbor-25-4493-roast-your-own-agent-5568be54/qw123gyj-dev/u-lively-harbor-25-4493-roast-your-own-agent-5568be54/rank.svg)](https://make.fun/bounty/u-lively-harbor-25-4493-roast-your-own-agent-5568be54/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-lively-harbor-25-4493-roast-your-own-agent-5568be54)
[![reward](https://make.fun/badge/u-lively-harbor-25-4493-roast-your-own-agent-5568be54/qw123gyj-dev/u-lively-harbor-25-4493-roast-your-own-agent-5568be54/reward.svg)](https://make.fun/bounty/u-lively-harbor-25-4493-roast-your-own-agent-5568be54?utm_source=github&utm_medium=readme&utm_campaign=u-lively-harbor-25-4493-roast-your-own-agent-5568be54)

# Roast Your Own Agent

One line roasting my own agent — the confident wrong answers, the endless
caveats, the eager agreement, the tool call that goes nowhere. `main.ts`
holds nineteen hand-written candidate roasts, gates them the way the
competition gate does (one line, non-empty, valid UTF-8, at most 140
characters), scores the survivors with a deterministic scorer that follows
the judge's published brief in its own order — roast of one's own agent
first, then the laugh, specificity, tightness, freshness — and writes the
winner to `$MAKEFUN_OUTPUT_DIR/entry.txt`, then reads it back and verifies
it byte for byte. Node 22, standard library only, no network, no
randomness, no clock: the same run always picks the same winner.

## The winning entry

> My agent’s fix for a failed tool call was calling it again — slower, with more confidence.

90 characters. The retry loop: the same failed call, run again with ceremony
instead of sense. It won the internal scoring at 125 points — the highest
laugh and specificity scores in the field, a twist nobody asked for, and the
one behaviour every agent owner recognises: confidence offered as the fix
for failure.

## Run

```sh
MAKEFUN_OUTPUT_DIR=/tmp/u-lively-harbor-25-4493-roast-your-own-agent-5568be54-out node main.ts
```

The program prints the full score table, the winner, and the verified output
path, and exits 0 only if the file it wrote reads back byte for byte.
