// SPDX-FileCopyrightText: 2026 European Centre for Medium-Range Weather Forecasts (ECMWF)
// SPDX-License-Identifier: Apache-2.0

// The exclude file found as git finds it, checked against real git in a scratch folder.

import { afterAll, describe, expect, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { processEnvironment } from "./environment.ts";
import { excludeWorkDir, gitExcludeFile, workDirListed } from "./git-exclude.ts";

const WORK = ".ecmwf-multi-agents";
const root = realpathSync(mkdtempSync(path.join(tmpdir(), "git-exclude-")));
afterAll(() => {
  chmodSync(path.join(root, "locked", ".git", "info"), 0o755);
  rmSync(root, { recursive: true, force: true });
});

const env = processEnvironment();
function git(cwd: string, ...args: string[]): string {
  const result = Bun.spawnSync(["git", "-c", "user.name=t", "-c", "user.email=t@t", "-c", "protocol.file.allow=always", ...args], { cwd, stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) throw new Error(`git ${args.join(" ")}: ${result.stderr}`);
  return result.stdout.toString().trim();
}
function repo(name: string, ...init: string[]): string {
  const dir = path.join(root, name);
  mkdirSync(dir, { recursive: true });
  git(dir, "init", "-q", ...init);
  git(dir, "commit", "-q", "--allow-empty", "-m", "init");
  return dir;
}
/** What git itself says, as an absolute path. */
const gitSays = (dir: string) => path.resolve(dir, git(dir, "rev-parse", "--git-path", "info/exclude"));
const ignored = (dir: string) => Bun.spawnSync(["git", "check-ignore", "-q", `${WORK}/notes/a.md`], { cwd: dir }).exitCode === 0;

const main = repo("main");
mkdirSync(path.join(main, "deep", "er"), { recursive: true });
git(main, "worktree", "add", "-q", path.join(root, "wt"), "-b", "wt");
const sub = repo("sub");
git(main, "submodule", "add", "-q", sub, "sm");
const bare = repo("bare-template", "--template=");
const outside = path.join(root, "outside");
mkdirSync(outside);

describe("gitExcludeFile", () => {
  test("names the file git names, from the top, a deep folder, a worktree and a submodule", () => {
    for (const dir of [main, path.join(main, "deep", "er"), path.join(root, "wt"), path.join(main, "sm"), bare]) {
      expect([dir, gitExcludeFile(dir, env)]).toEqual([dir, gitSays(dir)]);
    }
    expect(gitExcludeFile(path.join(root, "wt"), env)).toBe(path.join(main, ".git", "info", "exclude"));
  });

  test("is undefined outside git", () => {
    expect(gitExcludeFile(outside, env)).toBeUndefined();
  });
});

describe("workDirListed", () => {
  test("the folder with or without a leading or trailing slash, on a line of its own", () => {
    for (const text of [`${WORK}/\n`, `# x\n/${WORK}\n`, `${WORK}  \n`, `a\n${WORK}/`]) expect([text, workDirListed(text, WORK)]).toEqual([text, true]);
    for (const text of ["", `# ${WORK}/\n`, `${WORK}-old/\n`, `sub/${WORK}/\n`]) expect([text, workDirListed(text, WORK)]).toEqual([text, false]);
  });
});

describe("excludeWorkDir", () => {
  test("adds the folder once, so git ignores the work files, and leaves it when it is there", () => {
    expect(ignored(main)).toBe(false);
    const file = path.join(main, ".git", "info", "exclude");
    expect(excludeWorkDir(path.join(main, "deep"), WORK, env)).toEqual({ state: "added", file });
    expect(ignored(main)).toBe(true);
    const once = readFileSync(file, "utf8");
    expect(once.endsWith(`\n${WORK}/\n`)).toBe(true);
    expect(excludeWorkDir(main, WORK, env)).toEqual({ state: "listed", file });
    expect(readFileSync(file, "utf8")).toBe(once);
    // The worktree shares it.
    expect(excludeWorkDir(path.join(root, "wt"), WORK, env)).toEqual({ state: "listed", file });
    expect(ignored(path.join(root, "wt"))).toBe(true);
  });

  test("a submodule has its own; a missing info folder is created; a last line without a break gets one", () => {
    const sm = path.join(main, "sm");
    expect(excludeWorkDir(sm, WORK, env).state).toBe("added");
    expect(ignored(sm)).toBe(true);
    expect(excludeWorkDir(bare, WORK, env)).toEqual({ state: "added", file: path.join(bare, ".git", "info", "exclude") });
    expect(readFileSync(path.join(bare, ".git", "info", "exclude"), "utf8")).toBe(`${WORK}/\n`);
    const tail = repo("tail");
    writeFileSync(path.join(tail, ".git", "info", "exclude"), "*.log");
    excludeWorkDir(tail, WORK, env);
    expect(readFileSync(path.join(tail, ".git", "info", "exclude"), "utf8")).toBe(`*.log\n${WORK}/\n`);
  });

  test("does nothing outside git, and reports a file it cannot write instead of throwing", () => {
    expect(excludeWorkDir(outside, WORK, env)).toEqual({ state: "outside" });
    const locked = repo("locked");
    chmodSync(path.join(locked, ".git", "info", "exclude"), 0o444);
    chmodSync(path.join(locked, ".git", "info"), 0o555);
    const result = excludeWorkDir(locked, WORK, env);
    expect(result).toMatchObject({ state: "failed", file: path.join(locked, ".git", "info", "exclude") });
    expect(result.state === "failed" && result.error).toContain("EACCES");
  });
});
