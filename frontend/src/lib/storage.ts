export const getStorage = () => ({
  isVerified: localStorage.getItem('isVerified') === 'true',
  walletBalance: Number(localStorage.getItem('walletBalance') || '0'),
  vaultBalance: Number(localStorage.getItem('vaultBalance') || '0'),
  starknetAddress: localStorage.getItem('starknetAddress') || '',
});

export const setVerified = (address: string, amount: number) => {
  localStorage.setItem('isVerified', 'true');
  localStorage.setItem('walletBalance', String(amount));
  localStorage.setItem('vaultBalance', '0');
  localStorage.setItem('starknetAddress', address);
};

export const updateBalances = (wallet: number, vault: number) => {
  localStorage.setItem('walletBalance', String(wallet));
  localStorage.setItem('vaultBalance', String(vault));
};

export const clearAll = () => {
  localStorage.removeItem('isVerified');
  localStorage.removeItem('walletBalance');
  localStorage.removeItem('vaultBalance');
  localStorage.removeItem('starknetAddress');
};
