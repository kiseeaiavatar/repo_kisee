/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [new URL("https://drive.google.com/**")],
  },
};

export default nextConfig;
