/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    session?: import('../lib/server-session').WorkspaceSession
  }
}
