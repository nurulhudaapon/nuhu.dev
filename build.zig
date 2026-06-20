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

    // app_exe.root_module.addImport("lunasvg", b.dependency("lunasvg", .{}).module("lunasvg"));

    // --- ziex setup: wires dependencies and adds `ziex`/`dev` build steps ---
    _ = try ziex.init(b, app_exe, .{ .cli = .{ .optimize = optimize } });

    // Assets
    {
        const byakaron_assets_dep = b.dependency("byakaron_assets", .{});
        const install_byakaron_assets = b.addInstallDirectory(.{
            .source_dir = byakaron_assets_dep.path("."),
            .install_dir = .prefix,
            .install_subdir = "static/assets/_",
        });
        b.default_step.dependOn(&install_byakaron_assets.step);
    }
}
