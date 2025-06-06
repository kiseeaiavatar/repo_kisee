# Documentation: https://nixos.wiki/wiki/Flakes
# Documentation: https://yuanwang.ca/posts/getting-started-with-flakes.html
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
    nixpkgs_unstable.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs =
    {
      self,
      nixpkgs,
      nixpkgs_unstable,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      rec {
        # Development environment: nix develop
        devShells.default = pkgs.mkShell {
          nativeBuildInputs = with pkgs; [
            nodejs_22
            pnpm
          ];
        };
      }
    );
}
