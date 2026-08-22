'use client'

import { useState } from 'react'

export function HeroPhotoField({ current }: { current: string }) {
  const [picked, setPicked] = useState<string | null>(null)
  const preview = picked ?? current

  return (
    <fieldset className="hero-upload">
      <legend>Фото для hero</legend>
      <p>Портрет на первом экране. Вертикальный кадр, JPG или PNG, до 8 МБ.</p>
      {preview ? (
        // Blob preview of a newly picked file cannot go through next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="hero-upload-preview" src={preview} alt="Текущее фото hero" />
      ) : null}
      <label className="hero-upload-pick">
        Выбрать фото
        <input
          type="file"
          name="portrait"
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          onChange={(event) => {
            const file = event.target.files?.[0]
            setPicked(file ? URL.createObjectURL(file) : null)
          }}
        />
      </label>
    </fieldset>
  )
}
