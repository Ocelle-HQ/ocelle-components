# Phase 1 pinned visual evidence

Capture head `663820232a5df81195bd6c20a9c1a12931be9b55`. The full two-engine pinned comparison reported 36 expected baseline differences and no other findings. Exact decoded PNG comparisons have the same 1280 by 800 dimensions and change only one pixel row at the lower edge of the top bar in each updated image. Sample diff images for the standalone and composed bars were inspected. The other six candidate baselines and all images outside the two affected story files stay byte-identical.

[Full pinned comparison](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46090749386/job/140810832414) · [Diffs and baseline bytes](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46090749386/artifacts/15241094573) · [Decoded pixel bounds and exact blob verification](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46092466028)

| Baseline | Changed row | Changed pixels | SHA-256 |
| --- | --- | --- | --- |
| `elements-ocelle-app-shell--flush-block-end.dark.png` | 67 | 1248 | `33d4b80ddd934873237e84b88ee8a9c853b52fb4ff69b269246fa6678e816f06` |
| `elements-ocelle-app-shell--flush-block-end.light.png` | 67 | 1248 | `8a4160e77e934585cea7d8ed8b8707f18af715d31b63fea9fc93ec89c610a531` |
| `elements-ocelle-app-shell--flush-both-ends.dark.png` | 67 | 1248 | `9a5854c44f35e6ebb9d0e5f03926bb1d11c335abecdd05d69ecb8cb4d54ee48e` |
| `elements-ocelle-app-shell--flush-both-ends.light.png` | 67 | 1248 | `f41710597cad63e8dbdafe868b0c7aa54bfbdabf9dc45471660a080ca0294873` |
| `elements-ocelle-app-shell--flush-inline-end.dark.png` | 67 | 1248 | `9a5854c44f35e6ebb9d0e5f03926bb1d11c335abecdd05d69ecb8cb4d54ee48e` |
| `elements-ocelle-app-shell--flush-inline-end.light.png` | 67 | 1248 | `f41710597cad63e8dbdafe868b0c7aa54bfbdabf9dc45471660a080ca0294873` |
| `elements-ocelle-app-shell--mission-collapsed.dark.png` | 83 | 800 | `c77efa43fc77657d0653c718a6091aabceb75504a8957489d630ce3c6ab4caef` |
| `elements-ocelle-app-shell--mission-collapsed.light.png` | 83 | 800 | `3d72a298e5979c1f64e5a34d91e557104d2cd4c6b0f352c666852c20f60de2b1` |
| `elements-ocelle-app-shell--mission-expanded.dark.png` | 67 | 1248 | `4ed38cb65274906c4dc48830f7c0f1148c73616cf0ffc3f970f37a1f24db024e` |
| `elements-ocelle-app-shell--mission-expanded.light.png` | 67 | 1248 | `e302787d6f8874baee6f587c3cc3fb1a325e42ebc1cb16c163009c8a70b82d45` |
| `elements-ocelle-app-shell--mission-narrow.dark.png` | 83 | 288 | `a33aed853f3dd7ed973448a765535087b2329482705cbee0c3f8988a63e03c0c` |
| `elements-ocelle-app-shell--mission-narrow.light.png` | 83 | 288 | `5ca560f1209c9b66eca8401b6687146d56947afd9ffab6939f3ad5e72a394511` |
| `elements-ocelle-app-shell--omitted-regions.dark.png` | 67 | 1248 | `e8225826370395099ac839caedcd7bd96479b75c7ef4691b261dfcb9703cfa8d` |
| `elements-ocelle-app-shell--omitted-regions.light.png` | 67 | 1248 | `8d12f6e7eb12ce9e9a0f8ee1b6d4f48fdb870e38beccb7f6c2cd996d398da92b` |
| `elements-ocelle-app-shell--personal-narrow.dark.png` | 83 | 288 | `a33aed853f3dd7ed973448a765535087b2329482705cbee0c3f8988a63e03c0c` |
| `elements-ocelle-app-shell--personal-narrow.light.png` | 83 | 288 | `5ca560f1209c9b66eca8401b6687146d56947afd9ffab6939f3ad5e72a394511` |
| `elements-ocelle-app-shell--personal.dark.png` | 83 | 800 | `55e03868f95a87cb4283aafce59f6c371b3d6ea5df0e58b734a8121f5fcb34c7` |
| `elements-ocelle-app-shell--personal.light.png` | 83 | 800 | `8547c83cb1216b6b0ddee0b94fdb40a585ecf664ca56d26fe841336325572386` |
| `elements-ocelle-app-shell--project-collapsed.dark.png` | 83 | 800 | `154b96c7fa76ff081b3c51a2c531f39b0037d7a4188dad6cddae3a51adc4b2bf` |
| `elements-ocelle-app-shell--project-collapsed.light.png` | 83 | 800 | `29a334115df9a412b7e06e40851b27e1d58cc4d7490db72c009721c74da485f4` |
| `elements-ocelle-app-shell--project-expanded.dark.png` | 67 | 1248 | `38215690088fc431a841b9bdeb0700dde4b9c92c66d4009837ad11c45d568202` |
| `elements-ocelle-app-shell--project-expanded.light.png` | 67 | 1248 | `82a88c311644d2ac959c2ccd92e7ff2f3ea224ffa951fd4e2b43544a22979db7` |
| `elements-ocelle-app-shell--project-narrow.dark.png` | 83 | 288 | `a33aed853f3dd7ed973448a765535087b2329482705cbee0c3f8988a63e03c0c` |
| `elements-ocelle-app-shell--project-narrow.light.png` | 83 | 288 | `5ca560f1209c9b66eca8401b6687146d56947afd9ffab6939f3ad5e72a394511` |
| `elements-ocelle-top-bar--brand-only.dark.png` | 67 | 1248 | `c5a0912363308681f3560f8433626c8c4ca63d414223036b76a528c5f450969d` |
| `elements-ocelle-top-bar--brand-only.light.png` | 67 | 1248 | `bfc25cdc5a6e6f1bdf28a525d56329c49a21f0403ed066f350ba6f79455c08ca` |
| `elements-ocelle-top-bar--focused.dark.png` | 67 | 1248 | `d3c5e2c6c3e400343778c1e3f2fd5e0823fda7c90739163d74ace526c9e23eba` |
| `elements-ocelle-top-bar--focused.light.png` | 67 | 1248 | `d9ca6f2af6941362278dd94c21b39d304a41d6be201959775144a15483459183` |
| `elements-ocelle-top-bar--menu-closed.dark.png` | 67 | 1248 | `d3c5e2c6c3e400343778c1e3f2fd5e0823fda7c90739163d74ace526c9e23eba` |
| `elements-ocelle-top-bar--menu-closed.light.png` | 67 | 1248 | `d9ca6f2af6941362278dd94c21b39d304a41d6be201959775144a15483459183` |
| `elements-ocelle-top-bar--menu-expanded.dark.png` | 67 | 1248 | `d3c5e2c6c3e400343778c1e3f2fd5e0823fda7c90739163d74ace526c9e23eba` |
| `elements-ocelle-top-bar--menu-expanded.light.png` | 67 | 1248 | `d9ca6f2af6941362278dd94c21b39d304a41d6be201959775144a15483459183` |
| `elements-ocelle-top-bar--narrow.dark.png` | 83 | 288 | `691a144128d0c44faa775d3c863f3cd045bf08281a430e1b9ccc6610eaffd798` |
| `elements-ocelle-top-bar--narrow.light.png` | 83 | 288 | `46d79dda44f7713151bca988d4848a2850991da9b287f1334ad0e81b5234b2c7` |
| `elements-ocelle-top-bar--with-actions.dark.png` | 67 | 1248 | `f8d36c440dc29f232b31d35b6f05705c5d33a139e3a298dc7de38932697f8338` |
| `elements-ocelle-top-bar--with-actions.light.png` | 67 | 1248 | `063a5a849748eae3f38b78f2a06cef93760940b43269e405d028a47db34aeffc` |
