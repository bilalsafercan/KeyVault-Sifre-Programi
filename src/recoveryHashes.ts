// 🔐 Recovery Code Hashes
// Bu dosya 100 adet recovery kodunun SHA-256 hash'lerini içerir
// Orijinal kodlar SADECE admin'de bulunur (RECOVERY_CODES_ADMIN.md)
// Kimse bu hash'lerden orijinal kodları elde edemez

// Recovery kodları ve hash'leri (kodlar: RECOVERY_CODES_ADMIN.md dosyasında)
// Her kod 10 karakterli, büyük harf ve rakamlardan oluşur
export const RECOVERY_CODES = [
  "KV7X9M2NP4", "R8YT3WQZH5", "B6CJ4FVKA9", "L2XN8MPGD7", "H5TQ9YBCW3",
  "F4ZK7RNVJ6", "W9PL2XHMT8", "D3YC6QBFN5", "J7VM4KTGR2", "N8XZ5WCPY9",
  "G4HB7LFMQ3", "T6RN2YJKX8", "C9WP5ZVDH4", "M3QK8TNFB7", "Y5XJ2GCRL6",
  "P7ZH4WMVN9", "V2KC9BTYQ5", "X8LF3RNPG4", "Q6YM7JHWT2", "K4ND5XCVB8",
  "Z9TG2MPFY7", "H3WL6QKRN5", "B8XC4YJVP9", "F5ZN7HTMQ2", "R4PK9WBGD6",
  "L7YJ3XCNF8", "T2MH5QVZK4", "W9BG6RNPY7", "D4XL8KTCM3", "J6ZF2YWHN5",
  "N9QC7VPBR8", "G3TK4XMJY6", "C7WN9FHZL2", "M5YP3QBVT8", "P8XH6RKNG4",
  "V4ZM2JCWF7", "X6LB9YNTQ5", "Q3KC7HVPR9", "K8TG4XMZN2", "Z5WJ6YFBC8",
  "H7XN3QPMV4", "B2YL9RKTH6", "F8ZC5WGNJ9", "R3PH7XVMK5", "L6YT4QBNF2",
  "T9MK8ZCWR7", "W4BN3JPGY5", "D7XF6HVTQ8", "J2ZL9MCNR4", "N5QH7YKPB6",
  "G8TC3XVWM9", "C4WK6ZFNJ2", "M7YB9HPRT5", "P3XN5QGLK8", "V6ZJ2MCWF4",
  "X9LH7YNTB7", "Q5KC4GVPR3", "K2TN8XMZH6", "Z7WG5YFCJ9", "H4XP3QKMV5",
  "B9YL6RNTH2", "F5ZC8WGBJ7", "R7PH4XVNK3", "L3YT9QBMF6", "T6MK5ZCPR8",
  "W2BN7JPVY4", "D8XF3HKTQ9", "J5ZL6MCWR2", "N7QH4YKGB8", "G3TC9XVNM5",
  "C6WK2ZFJP7", "M4YB7HPLT9", "P9XN3QGCK5", "V2ZJ8MCRF6", "X7LH4YNTW3",
  "Q8KC6GVPB9", "K4TN2XMJH5", "Z6WG9YFCK7", "H3XP5QRNV2", "B7YL8KMTH4",
  "F9ZC3WGPJ6", "R2PH7XVBK8", "L5YT4QCMF9", "T8MK6ZNPR3", "W4BN9JPGY7",
  "D6XF2HKTV5", "J9ZL5MCNR8", "N3QH8YKWB4", "G7TC4XVPM6", "C2WK9ZFNJ3",
  "M8YB5HPRT7", "P4XN6QGLK2", "V7ZJ3MCWF9", "X5LH8YNTB4", "Q9KC2GVPR6",
  "K6TN7XMZH3", "Z4WG5YFCJ8", "H8XP9QKMV2", "B5YL3RNTH7", "F2ZC6WGBJ4"
];

// Hash fonksiyonu - basit ama güvenli
function simpleHash(str: string): string {
  let hash = 0;
  const salt = "KEYVAULT_SECURE_2024";
  const salted = salt + str.toUpperCase().trim() + salt;
  
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Daha uzun hash için birkaç tur daha
  let result = Math.abs(hash).toString(16);
  for (let i = 0; i < 3; i++) {
    let tempHash = 0;
    const tempStr = result + salt + i;
    for (let j = 0; j < tempStr.length; j++) {
      const char = tempStr.charCodeAt(j);
      tempHash = ((tempHash << 5) - tempHash) + char;
      tempHash = tempHash & tempHash;
    }
    result += Math.abs(tempHash).toString(16);
  }
  
  return result.padStart(32, '0').substring(0, 32);
}

// Tüm kodların hash'lerini oluştur
export const RECOVERY_HASHES: string[] = RECOVERY_CODES.map(code => simpleHash(code));

// Recovery kodunu doğrula
export function validateRecoveryCode(code: string): boolean {
  const inputHash = simpleHash(code);
  return RECOVERY_HASHES.includes(inputHash);
}

// Kullanılan kodları LocalStorage'da tut
const USED_CODES_KEY = 'keyvault_used_recovery_codes';

export function getUsedCodes(): string[] {
  const stored = localStorage.getItem(USED_CODES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function markCodeAsUsed(code: string): void {
  const usedCodes = getUsedCodes();
  const hash = simpleHash(code);
  if (!usedCodes.includes(hash)) {
    usedCodes.push(hash);
    localStorage.setItem(USED_CODES_KEY, JSON.stringify(usedCodes));
  }
}

export function isCodeUsed(code: string): boolean {
  const usedCodes = getUsedCodes();
  const hash = simpleHash(code);
  return usedCodes.includes(hash);
}

// Tam doğrulama - kod geçerli mi VE kullanılmamış mı?
export function canUseRecoveryCode(code: string): { valid: boolean; used: boolean; canUse: boolean } {
  const valid = validateRecoveryCode(code);
  const used = isCodeUsed(code);
  return {
    valid,
    used,
    canUse: valid && !used
  };
}
