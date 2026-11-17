/** Çatışma ve meta sabitleri — denge tasarımcı olarak burayı oynuyorsunuz. */

/** Her tur başına enerji yenilemesi başlangıç değeri. */
export const STARTING_MAX_ENERGY = 3 as const

/** İlk oyuncu turunda ve her tur sonundan sonra çekilen kart (+ çatışmanın ilk eli için). */
export const HAND_DRAW_SIZE = 5 as const

/** Elimiz ötesine taşmak yerine fazla kart çekmeyi atlama (Sts’ye benzer sınır için). */
export const MAX_HAND_SIZE = 12 as const

/** Oyuncu başlangıç canı — düşman debuff / çok vuruşları ile denge. */
export const PLAYER_MAX_HP = 42 as const
