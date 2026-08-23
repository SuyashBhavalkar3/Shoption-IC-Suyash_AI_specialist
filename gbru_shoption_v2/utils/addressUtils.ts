export const getPlaceNames = (addr: any) => {
  if (!addr.html) return { marketplace: addr.marketplace, tahsil: addr.tahsil, district: addr.district };
  const parts = addr.html.split('<br>');
  const pinIndex = parts.findIndex((p: string) => p.startsWith('PIN Code'));
  if (pinIndex >= 4) {
    return {
      marketplace: parts[pinIndex - 4],
      tahsil: parts[pinIndex - 3],
      district: parts[pinIndex - 2]
    };
  }
  return { marketplace: addr.marketplace, tahsil: addr.tahsil, district: addr.district };
};
