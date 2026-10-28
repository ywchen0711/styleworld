# Style World 六界第一關

A classic first level, a run-and-jump platformer, played in six different worlds. Press 1–6 at any moment to switch,
mid-jump if you like. The level and the characters are original: Pip, a round little hero with a sprout and a scarf,
beetles, snails with kickable shells, gift boxes, a growth berry, a gate at the end. They are made in the spirit of
the genre's famous opening stage, not copied from it.

**Play:** https://ywchen0711.github.io/styleworld/ (add `?style=1`…`6`)

| # | World | How it is drawn |
|---|-------|-----------------|
| 1 | 貼紙世界 Sticker world | die-cut stickers on a notebook page: white margins, shadows, a tilt, lifting corners, gloss |
| 2 | 青花瓷世界 Blue-and-white porcelain | only porcelain white and cobalt: waves, key-fret, medallions, glaze highlights; a struck brick shows crackle (冰裂紋), a broken one bursts into painted shards |
| 3 | Risograph | three inks (fluoro pink, blue, yellow) as halftone layers, multiplied, off register, with grain |
| 4 | 十字繡世界 Cross-stitch | drawn at 8 stitches a tile, each square an X of thread on aida cloth, backstitched outlines, the sky left bare |
| 5 | 等高線世界 Contour map | the land is surveyed: contour lines, hypsometric tints, index heights, isobar clouds, compass and scale bar |
| 6 | 立體書 Pop-up book | paper cards on a book spread: thick edges, soft shadows, struts, cards fold up as they come in, cut-outs on pull tabs |

**Controls:** ← → or A/D to move, Space/Z/↑ to jump (hold to go higher), 1–6 to change world, R to restart.
Touch buttons appear on phones.

## How it works

- `js/game.js` holds the rules. They are the same in every world. Each frame it describes what is on screen.
- `js/styles/common.js` turns that description into plain shapes, each with a role (`body`, `brick`, `shell`…) and a
  group id.
- Each style in `js/styles/` decides only how a shape of each role looks. To add a world, write a module with
  `draw(g, view)` and list it in `js/styles/index.js`.
