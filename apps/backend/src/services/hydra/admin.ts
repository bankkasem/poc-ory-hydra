export function hydraAdminUrl(path: string) {
  if (!Bun.env.HYDRA_ADMIN_URL) throw new Error("HYDRA_ADMIN_URL is required");
  return new URL(path, Bun.env.HYDRA_ADMIN_URL);
}
