// Heritage Passport Stamp Database Utility

export const getEarnedStamps = () => {
  const data = localStorage.getItem('heritage_passport_stamps');
  return data ? JSON.parse(data) : [];
};

export const addEarnedStamp = (site) => {
  const stamps = getEarnedStamps();
  if (!stamps.some(s => s.siteId === site.id)) {
    const motif = getStampMotif(site.civilizationEra, site.siteType);
    const stamp = {
      siteId: site.id,
      siteName: site.name,
      civilization: site.civilizationEra,
      siteType: site.siteType,
      province: site.province,
      unescoListed: site.unescoListed,
      icon: motif.icon,
      dateEarned: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    };
    stamps.push(stamp);
    localStorage.setItem('heritage_passport_stamps', JSON.stringify(stamps));
    return true; // Newly unlocked
  }
  return false; // Already unlocked
};

// Map civilization eras / site types to specific passport motifs
export const getStampMotif = (civilizationEra, siteType) => {
  const era = civilizationEra?.toLowerCase() || '';
  const type = siteType?.toLowerCase() || '';
  
  // Prioritize type-based icons first (e.g., a Fort should have a Fort stamp even if it's from the Mughal era)
  if (type.includes('fort')) {
    if (era.includes('mughal')) return { icon: 'castle', label: 'Mughal Fort' };
    return { icon: 'castle', label: 'Historical Fort' };
  }
  
  if (era.includes('mughal')) return { icon: 'moon-star', label: 'Mughal' };
  if (era.includes('indus')) return { icon: 'gem', label: 'Indus Valley' };
  if (era.includes('gandhara') || era.includes('buddhist')) return { icon: 'scroll', label: 'Gandhara' };
  if (era.includes('hindu')) return { icon: 'flame', label: 'Hindu Heritage' };
  if (era.includes('sufi')) return { icon: 'flame', label: 'Sufi Shrine' };
  if (era.includes('islamic')) return { icon: 'moon-star', label: 'Islamic Heritage' };
  if (era.includes('neolithic')) return { icon: 'gem', label: 'Neolithic' };
  
  return { icon: 'landmark', label: 'Monument' };
};
