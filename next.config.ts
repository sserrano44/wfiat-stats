import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Transpile ESM packages for graph visualization
  transpilePackages: [
    "sigma",
    "graphology",
    "graphology-layout-forceatlas2",
    "graphology-communities-louvain",
    "@react-sigma/core",
  ],
};

export default nextConfig;
