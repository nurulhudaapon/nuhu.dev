const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const lunasvg_dep = b.dependency("lunasvg", .{});
    const lunasvg_root = lunasvg_dep.path(".");

    const static_lib = addLunasvg(b, target, optimize, .static);
    _ = addLunasvg(b, target, optimize, .shared);

    const lunasvg_mod = b.addModule("lunasvg", .{
        .root_source_file = b.path("src/root.zig"),
        .target = target,
        .optimize = optimize,
        .link_libcpp = true,
    });
    lunasvg_mod.linkLibrary(static_lib);

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
        mod.addIncludePath(lunasvg_dep.path("include"));
        mod.addCSourceFiles(.{
            .root = lunasvg_root,
            .files = &.{"examples/svg2png.cpp"},
            .flags = &.{"-std=c++17"},
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
    mod.addIncludePath(lunasvg_dep.path("source"));
    mod.addIncludePath(lunasvg_dep.path("plutovg/include"));
    mod.addIncludePath(lunasvg_dep.path("plutovg/source"));
    mod.addCMacro("PLUTOVG_BUILD", "");

    switch (kind) {
        .static => {
            mod.addCMacro("LUNASVG_BUILD", "");
            mod.addCMacro("LUNASVG_BUILD_STATIC", "");
            mod.addCMacro("PLUTOVG_BUILD_STATIC", "");
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
        .files = &lunasvg_cpp_files,
        .flags = &.{"-std=c++17"},
    });
    mod.addCSourceFiles(.{
        .root = lunasvg_dep.path("."),
        .files = &plutovg_c_files,
        .flags = &.{"-std=c11"},
    });
    mod.addCSourceFiles(.{
        .root = b.path("."),
        .files = &.{"src/lunasvg_shim.cpp"},
        .flags = &.{"-std=c++17"},
    });
    b.installArtifact(lib);
    return lib;
}

const lunasvg_cpp_files = [_][]const u8{
    "source/lunasvg.cpp",
    "source/graphics.cpp",
    "source/svgelement.cpp",
    "source/svggeometryelement.cpp",
    "source/svglayoutstate.cpp",
    "source/svgpaintelement.cpp",
    "source/svgparser.cpp",
    "source/svgproperty.cpp",
    "source/svgrenderstate.cpp",
    "source/svgtextelement.cpp",
};

const plutovg_c_files = [_][]const u8{
    "plutovg/source/plutovg-blend.c",
    "plutovg/source/plutovg-canvas.c",
    "plutovg/source/plutovg-font.c",
    "plutovg/source/plutovg-matrix.c",
    "plutovg/source/plutovg-paint.c",
    "plutovg/source/plutovg-path.c",
    "plutovg/source/plutovg-rasterize.c",
    "plutovg/source/plutovg-surface.c",
    "plutovg/source/plutovg-ft-math.c",
    "plutovg/source/plutovg-ft-raster.c",
    "plutovg/source/plutovg-ft-stroker.c",
};
