// SPDX-FileCopyrightText: 2026 European Centre for Medium-Range Weather Forecasts (ECMWF)
// SPDX-License-Identifier: Apache-2.0

// Keeps the harness's work folder out of git: at each session start the plugin adds the folder
// to the repository's exclude file, the one `git rev-parse --git-path info/exclude` names,
// found without running git (docs/research/opencode-v2.md, Addendum: the work folder in git's
// exclude file). The file is local to the clone, so nothing reaches a commit.

import path from "node:path";
import type { Environment } from "./types.ts";

/** The exclude file of the repository holding `directory`, or undefined outside git. */
export function gitExcludeFile(directory: string, environment: Environment): string | undefined {
  let dir = path.resolve(directory);
  for (;;) {
    const dotGit = path.join(dir, ".git");
    if (environment.isDirectory(dotGit)) return path.join(commonDir(dotGit, environment), "info", "exclude");
    // A worktree or a submodule: a file naming the git folder, relative to the file's folder.
    const gitdir = /^gitdir:\s*(.+?)\s*$/m.exec(environment.readFile(dotGit) ?? "")?.[1];
    if (gitdir !== undefined) {
      const resolved = path.resolve(dir, gitdir);
      return path.join(commonDir(resolved, environment), "info", "exclude");
    }
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/** The folder a git folder shares with its repository: `commondir` names it, as for a worktree. */
function commonDir(gitDir: string, environment: Environment): string {
  const common = environment.readFile(path.join(gitDir, "commondir"))?.trim();
  return common === undefined || common === "" ? gitDir : path.resolve(gitDir, common);
}

/** True when a line of the exclude file is the work folder, with or without a leading or trailing slash. */
export function workDirListed(text: string, workDir: string): boolean {
  const name = workDir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^/?${name}/?[ \\t]*\\r?$`, "m").test(text);
}

export type ExcludeResult =
  | { state: "outside" }
  | { state: "listed"; file: string }
  | { state: "added"; file: string }
  | { state: "failed"; file: string; error: string };

/** Add the work folder to the exclude file once; never throws. */
export function excludeWorkDir(directory: string, workDir: string, environment: Environment): ExcludeResult {
  let file: string | undefined;
  try {
    file = gitExcludeFile(directory, environment);
    if (file === undefined) return { state: "outside" };
    const text = environment.readFile(file) ?? "";
    if (workDirListed(text, workDir)) return { state: "listed", file };
    environment.appendFile(file, `${text === "" || text.endsWith("\n") ? "" : "\n"}${workDir}/\n`);
    return { state: "added", file };
  } catch (error) {
    return { state: "failed", file: file ?? directory, error: error instanceof Error ? error.message : String(error) };
  }
}
