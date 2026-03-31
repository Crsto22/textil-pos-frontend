export const PROFILE_PHOTO_MAX_BYTES = 3 * 1024 * 1024

export const PROFILE_PHOTO_ACCEPTED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
]

export function validateProfilePhoto(file: File): string | null {
    if (!PROFILE_PHOTO_ACCEPTED_TYPES.includes(file.type)) {
        return "Formato de imagen no permitido"
    }

    if (file.size > PROFILE_PHOTO_MAX_BYTES) {
        return "La foto de perfil no debe superar 3MB"
    }

    return null
}
