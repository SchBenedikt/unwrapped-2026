/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "pv-912928a19782-agent37-eef6039e-559a-47d9-8ca1-7b8be47b5416.freebuff.site",
    "fa0nmoq1ys-3000.agent37.app",
    "426gumm0r8-3000.agent37.app",
    "pv-912928a19782-agent37-bdcc9e5e-eaa3-4ed6-a92b-8f63ca0290cc.freebuff.site",
  ],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "avatars.githubusercontent.com" }],
  },
};

export default nextConfig;
