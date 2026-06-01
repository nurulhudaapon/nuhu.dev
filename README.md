
# nuhu.dev

<p align="center">
	<img src="app/public/nuhu-dev-og.png" alt="nuhu.dev social preview" width="800" />
</p>

<p align="center"><em>Building fast, simple software for the modern web - personal site of Nurul Huda (Apon).</em></p>

## Developing
Requirements: `zig` (0.16.0)

Start dev server (http://localhost:3000):
```bash
zig build dev
```

Build static site (output in `dist/`):

```bash
zig build --release=small
zig build zx -- export
```
Built with

- Ziex: https://ziex.dev
- Zig: https://ziglang.org
