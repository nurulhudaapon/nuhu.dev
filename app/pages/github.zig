const std = @import("std");

const GITHUB_API_URL = "https://api.github.com/users/nurulhudaapon/repos?per_page=100";

// Pinned repos in display order
const PINNED_REPOS = [_][]const u8{
    "ziex",
    "zzon",
    "prisma-supabase",
    "nx-sst-next",
    "enum-map-generator",
    "temporalz",
    "bencher",
    "supabase-mock-fetch",
};

pub const Project = struct {
    name: []const u8,
    description: []const u8,
    language: []const u8,
    stars: u32,
    forks: u32,
    url: []const u8,
};

const FetchError = error{ FailedToFetch, FailedToParse, OutOfMemory };

pub fn getPinnedRepos(allocator: std.mem.Allocator) FetchError![]Project {
    var client = std.http.Client{ .allocator = allocator };
    defer client.deinit();

    var aw = std.Io.Writer.Allocating.init(allocator);

    _ = client.fetch(.{
        .method = .GET,
        .location = .{ .url = GITHUB_API_URL },
        .headers = .{
            .user_agent = .{ .override = "nuhu.dev" },
        },
        .response_writer = &aw.writer,
    }) catch |err| {
        std.log.err("Failed to fetch repos: {any}", .{err});
        return error.FailedToFetch;
    };

    const response_text = aw.written();
    return filterPinnedRepos(allocator, response_text) catch |err| {
        std.log.err("Failed to parse repos: {any}", .{err});
        return error.FailedToParse;
    };
}

fn filterPinnedRepos(allocator: std.mem.Allocator, json_text: []const u8) ![]Project {
    const parsed = try std.json.parseFromSlice([]GitHubRepo, allocator, json_text, .{ .ignore_unknown_fields = true });
    const all_repos = parsed.value;

    const projects = try allocator.alloc(Project, PINNED_REPOS.len);
    var count: usize = 0;

    // Iterate pinned names in order, find matching repo from API response
    for (PINNED_REPOS) |pinned_name| {
        for (all_repos) |repo| {
            if (std.mem.eql(u8, repo.name, pinned_name)) {
                projects[count] = .{
                    .name = repo.name,
                    .description = repo.description orelse "No description",
                    .language = repo.language orelse "Unknown",
                    .stars = repo.stargazers_count,
                    .forks = repo.forks_count,
                    .url = repo.html_url,
                };
                count += 1;
                break;
            }
        }
    }

    return projects[0..count];
}

const GitHubRepo = struct {
    name: []const u8,
    description: ?[]const u8,
    html_url: []const u8,
    stargazers_count: u32,
    forks_count: u32,
    language: ?[]const u8,
};
