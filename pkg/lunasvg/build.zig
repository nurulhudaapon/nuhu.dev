const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const lunasvg_dep = b.dependency("lunasvg", .{});
    const lunasvg_root = lunasvg_dep.path(".");

    const static_lib = addLunasvg(b, target, optimize, .static);
    _ = addLunasvg(b, target, optimize, .shared);

    {
        const mod = b.createModule(.{
            .target = target,
            .optimize = optimize,
            .link_libcpp = true,
        });
        const exe = b.addExecutable(.{
            .name = "svg2png",
            .root_module = mod,
        });
        mod.addIncludePath(lunasvg_dep.path("3rdparty/stb"));
        mod.addCSourceFiles(.{
            .root = lunasvg_root,
            .files = &.{"svg2png.cpp"},
        });

        mod.linkLibrary(static_lib);
        b.installArtifact(exe);

        const run_cmd = b.addRunArtifact(exe);
        if (b.args) |args| {
            run_cmd.addArgs(args);
        }
        const run_step = b.step("svg2png", "Run svg2png");
        run_step.dependOn(&run_cmd.step);
    }
}

pub fn addLunasvg(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    kind: enum { static, shared },
) *std.Build.Step.Compile {
    const lunasvg_dep = b.dependency("lunasvg", .{});
    const mod = b.createModule(.{
        .target = target,
        .optimize = optimize,
        .link_libcpp = true,
    });

    const lib = switch (kind) {
        .static => b.addLibrary(.{
            .name = "lunasvg-static",
            .root_module = mod,
            .linkage = .static,
        }),
        .shared => b.addLibrary(.{
            .name = "lunasvg",
            .root_module = mod,
            .linkage = .dynamic,
        }),
    };

    mod.addIncludePath(lunasvg_dep.path("include"));
    mod.addIncludePath(lunasvg_dep.path("3rdparty/plutovg"));

    switch (kind) {
        .static => {
            mod.addCMacro("LUNASVG_BUILD_STATIC", "");
            lib.installHeader(
                lunasvg_dep.path("include/lunasvg.h"),
                "lunasvg-unconfigured.h",
            );
            const w = b.addWriteFiles();
            lib.installHeader(
                w.add("lunasvg.h", ("#define LUNASVG_BUILD_STATIC\n" ++
                    "#include \"lunasvg-unconfigured.h\"\n")),
                "lunasvg.h",
            );
        },
        .shared => {
            mod.addCMacro("LUNASVG_BUILD", "");
        },
    }
    mod.addCSourceFiles(.{
        .root = lunasvg_dep.path("."),
        .files = &lunasvg_files,
    });
    b.installArtifact(lib);
    return lib;
}

const lunasvg_files = [_][]const u8{
    "source/lunasvg.cpp",
    "source/element.cpp",
    "source/property.cpp",
    "source/parser.cpp",
    "source/layoutcontext.cpp",
    "source/canvas.cpp",
    "source/clippathelement.cpp",
    "source/defselement.cpp",
    "source/gelement.cpp",
    "source/geometryelement.cpp",
    "source/graphicselement.cpp",
    "source/maskelement.cpp",
    "source/markerelement.cpp",
    "source/paintelement.cpp",
    "source/stopelement.cpp",
    "source/styledelement.cpp",
    "source/styleelement.cpp",
    "source/svgelement.cpp",
    "source/symbolelement.cpp",
    "source/useelement.cpp",

    "3rdparty/plutovg/plutovg.c",
    "3rdparty/plutovg/plutovg-paint.c",
    "3rdparty/plutovg/plutovg-geometry.c",
    "3rdparty/plutovg/plutovg-blend.c",
    "3rdparty/plutovg/plutovg-rle.c",
    "3rdparty/plutovg/plutovg-dash.c",
    "3rdparty/plutovg/plutovg-ft-raster.c",
    "3rdparty/plutovg/plutovg-ft-stroker.c",
    "3rdparty/plutovg/plutovg-ft-math.c",
};
