import argparse
from typing import Iterable

import numpy as np
from pose_format import Pose


def _resolve_edge_indices(header, component, limb) -> tuple[int, int]:
    # limb can be indices into component.points or point names
    a, b = limb
    if isinstance(a, str) or isinstance(b, str):
        a_idx = header._get_point_index(component.name, a)
        b_idx = header._get_point_index(component.name, b)
        return a_idx, b_idx

    # If indices are small, treat as local component indices; otherwise as global.
    if max(a, b) < len(component.points):
        a_idx = header._get_point_index(component.name, component.points[a])
        b_idx = header._get_point_index(component.name, component.points[b])
        return a_idx, b_idx

    return int(a), int(b)


def _iter_edges(header) -> Iterable[tuple[tuple[int, int], str, tuple[int, int, int] | None]]:
    for component in header.components:
        for idx, limb in enumerate(component.limbs):
            color = None
            if idx < len(component.colors):
                color = tuple(int(c) for c in component.colors[idx])
            yield _resolve_edge_indices(header, component, limb), component.name, color


def _get_bounds(points, conf):
    valid = conf > 0
    if not np.any(valid):
        return (-1, 1, -1, 1)
    pts = points[valid]
    min_x, min_y = pts.min(axis=0)
    max_x, max_y = pts.max(axis=0)
    # add padding
    pad_x = (max_x - min_x) * 0.1 + 1e-6
    pad_y = (max_y - min_y) * 0.1 + 1e-6
    return (min_x - pad_x, max_x + pad_x, min_y - pad_y, max_y + pad_y)


def _color_from_component(color):
    if color is None:
        return "#d72638"

    r, g, b = color
    max_c = max(r, g, b)
    if max_c <= 1:
        return (float(r), float(g), float(b))
    if max_c <= 255:
        return f"#{int(r):02x}{int(g):02x}{int(b):02x}"
    # assume 0..65535
    return (float(r) / 65535.0, float(g) / 65535.0, float(b) / 65535.0)


def _find_point_index(header, names):
    lowered = {name.lower(): name for name in names}
    for component in header.components:
        for i, point in enumerate(component.points):
            key = point.lower()
            if key in lowered:
                return header._get_point_index(component.name, point)
    return None


def _get_point(frame_points, frame_conf, idx):
    if idx is None:
        return None
    if frame_conf[idx] <= 0:
        return None
    return frame_points[idx]


def _render_frames(pose: Pose, width: int, height: int, line_width: float, point_size: float, style: str, female: bool):
    import matplotlib

    matplotlib.use("Agg")
    from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
    from matplotlib.figure import Figure
    from matplotlib import patches

    edges = list(_iter_edges(pose.header))

    num_frames = len(pose.body.data)
    for i in range(num_frames):
        frame_points = pose.body.data[i, 0, :, :2]
        frame_conf = pose.body.confidence[i, 0, :]

        fig = Figure(figsize=(width / 100, height / 100), dpi=100)
        canvas = FigureCanvas(fig)
        ax = fig.add_axes([0, 0, 1, 1])
        ax.set_axis_off()

        min_x, max_x, min_y, max_y = _get_bounds(frame_points, frame_conf)
        ax.set_xlim(min_x, max_x)
        ax.set_ylim(max_y, min_y)  # invert Y to keep a natural view
        if style in {"pretty", "avatar"}:
            bg = "#f7f5f2" if style == "pretty" else "#f3f6ff"
            fig.patch.set_facecolor(bg)
            ax.set_facecolor(bg)

        for (a_idx, b_idx), comp_name, color in edges:
            if frame_conf[a_idx] <= 0 or frame_conf[b_idx] <= 0:
                continue
            x = [frame_points[a_idx, 0], frame_points[b_idx, 0]]
            y = [frame_points[a_idx, 1], frame_points[b_idx, 1]]
            stroke = _color_from_component(color)
            if style == "avatar":
                stroke = "#2b2d42"
            ax.plot(
                x,
                y,
                color=stroke,
                linewidth=line_width,
                solid_capstyle="round",
                solid_joinstyle="round",
                antialiased=True,
            )

        visible = frame_conf > 0
        if np.any(visible):
            ax.scatter(
                frame_points[visible, 0],
                frame_points[visible, 1],
                s=point_size,
                c="#111111" if style == "clean" else "#2b2b2b",
                alpha=0.9,
            )

        if style == "avatar":
            # simple head shape if a head point exists
            head = _find_point_index(
                pose.header, ["NOSE", "HEAD", "HEAD_TOP", "LEFT_EYE", "RIGHT_EYE", "FACE_CENTER"]
            )
            hc = _get_point(frame_points, frame_conf, head)
            ls = _get_point(frame_points, frame_conf, _find_point_index(pose.header, ["LEFT_SHOULDER", "L_SHOULDER"]))
            rs = _get_point(frame_points, frame_conf, _find_point_index(pose.header, ["RIGHT_SHOULDER", "R_SHOULDER"]))
            if hc is not None and ls is not None and rs is not None:
                shoulder_width = np.linalg.norm(ls - rs)
                head_r = shoulder_width * 0.35
                face = patches.Circle(
                    (hc[0], hc[1] - head_r * 0.1),
                    radius=head_r,
                    facecolor="#f1c27d",
                    edgecolor="#2b2d42",
                    linewidth=2.0,
                    alpha=0.9,
                    zorder=0,
                )
                ax.add_patch(face)

        if female:
            left_shoulder = _find_point_index(pose.header, ["LEFT_SHOULDER", "L_SHOULDER"])
            right_shoulder = _find_point_index(pose.header, ["RIGHT_SHOULDER", "R_SHOULDER"])
            left_hip = _find_point_index(pose.header, ["LEFT_HIP", "L_HIP"])
            right_hip = _find_point_index(pose.header, ["RIGHT_HIP", "R_HIP"])
            head = _find_point_index(
                pose.header, ["NOSE", "HEAD", "HEAD_TOP", "LEFT_EYE", "RIGHT_EYE", "FACE_CENTER"]
            )

            ls = _get_point(frame_points, frame_conf, left_shoulder)
            rs = _get_point(frame_points, frame_conf, right_shoulder)
            lh = _get_point(frame_points, frame_conf, left_hip)
            rh = _get_point(frame_points, frame_conf, right_hip)
            hc = _get_point(frame_points, frame_conf, head)

            if ls is not None and rs is not None:
                shoulder_width = np.linalg.norm(ls - rs)
            else:
                shoulder_width = None

            if hc is not None and shoulder_width is not None:
                hair_r = shoulder_width * 0.28
                hair = patches.Circle(
                    (hc[0], hc[1] - hair_r * 0.15),
                    radius=hair_r * 1.15,
                    facecolor="#4a2c2a",
                    edgecolor="none",
                    alpha=0.7,
                    zorder=0,
                )
                ax.add_patch(hair)

            if ls is not None and rs is not None and lh is not None and rh is not None:
                mid_sh = (ls + rs) / 2
                mid_hip = (lh + rh) / 2
                flare = (rs[0] - ls[0]) * 0.25
                dress = patches.Polygon(
                    [
                        (ls[0], ls[1]),
                        (rs[0], rs[1]),
                        (mid_hip[0] + flare, mid_hip[1] + shoulder_width * 0.6),
                        (mid_hip[0] - flare, mid_hip[1] + shoulder_width * 0.6),
                    ],
                    closed=True,
                    facecolor="#f48fb1",
                    edgecolor="none",
                    alpha=0.35,
                    zorder=0,
                )
                ax.add_patch(dress)

        canvas.draw()
        if hasattr(canvas, "buffer_rgba"):
            buf = canvas.buffer_rgba()
            img = np.asarray(buf, dtype=np.uint8)
            img = img.reshape((height, width, 4))[:, :, :3]
        else:
            # Matplotlib 3.8+: tostring_rgb removed for Agg, use tostring_argb
            argb = np.frombuffer(canvas.tostring_argb(), dtype=np.uint8)
            argb = argb.reshape((height, width, 4))
            img = argb[:, :, 1:]  
        yield img


def pose_to_skeleton_video(pose_path: str, video_path: str, fps: int, width: int, height: int, style: str, female: bool):
    import imageio.v2 as imageio

    with open(pose_path, "rb") as f:
        pose = Pose.read(f.read())

    if fps <= 0:
        fps = int(round(pose.body.fps))

    if style == "pretty":
        line_width = 4.0
        point_size = 10.0
    elif style == "avatar":
        line_width = 6.0
        point_size = 12.0
    else:
        line_width = 3.0
        point_size = 6.0
    frames = _render_frames(
        pose, width=width, height=height, line_width=line_width, point_size=point_size, style=style, female=female
    )
    with imageio.get_writer(video_path, fps=fps, codec="libx264") as writer:
        for frame in frames:
            writer.append_data(frame)


def main():
    parser = argparse.ArgumentParser(description="Render a .pose file as a skeleton video.")
    parser.add_argument("--pose", required=True, type=str)
    parser.add_argument("--video", required=True, type=str)
    parser.add_argument("--fps", type=int, default=0, help="0 uses pose fps")
    parser.add_argument("--width", type=int, default=640)
    parser.add_argument("--height", type=int, default=480)
    parser.add_argument("--style", choices=["clean", "pretty", "avatar"], default="pretty")
    parser.add_argument("--female", action="store_true")
    args = parser.parse_args()

    pose_to_skeleton_video(
        args.pose,
        args.video,
        fps=args.fps,
        width=args.width,
        height=args.height,
        style=args.style,
        female=args.female,
    )


if __name__ == "__main__":
    main()
