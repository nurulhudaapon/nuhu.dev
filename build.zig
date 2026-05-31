const std = @import("std");
const ziex = @import("ziex");

pub fn build(b: *std.Build) !void {
    // --- Target and Optimize from `zig build` arguments ---
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // --- ziex App Executable ---
    const app_exe = b.addExecutable(.{
        .name = "nuhu_dev",
        .root_module = b.createModule(.{
            .root_source_file = b.path("app/main.zig"),
            .target = target,
            .optimize = optimize,
        }),
    });

    // --- ziex setup: wires dependencies and adds `ziex`/`dev` build steps ---
    _ = try ziex.init(b, app_exe, .{});
}
