# Face morph video

Builds `public/faces/evolution.mp4`, the grey wolf → dog → wolf morph on the home page.

- `lm.py`: 12 hand-placed landmarks per 360px face crop
- `render.py`: Delaunay warp plus a frequency-staggered blend, piped to ffmpeg; also writes the timeline that becomes `src/data/faces.json` `segments`

Needs OpenCV, NumPy, SciPy and an ffmpeg binary. The ten dog crops (Dog CEO / Stanford Dogs) aren't kept in `public/`; put them beside `grey-wolf.jpg` as `<slug>.jpg` before rendering:

    python render.py <dir of lm.py> <faces dir> <output path without extension> <ffmpeg.exe>
