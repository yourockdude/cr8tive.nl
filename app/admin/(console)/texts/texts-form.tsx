'use client'

import { useActionState } from 'react'
import { saveTextsAction } from '@/app/admin/actions'
import { HeroPhotoField } from '@/app/admin/(console)/texts/hero-photo-field'
import type { SiteContent } from '@/lib/types'

const zones = [
  'Europe/Amsterdam',
  'Europe/Berlin',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Moscow',
  'Europe/Belgrade',
  'Asia/Tbilisi',
  'Asia/Dubai',
  'America/New_York',
  'America/Los_Angeles',
]

export function TextsForm({ site }: { site: SiteContent }) {
  const [state, action, pending] = useActionState(saveTextsAction, {})

  return (
    <form className="admin-form" action={action} encType="multipart/form-data">
      <HeroPhotoField key={site.portrait} current={site.portrait} />
      <div className="row">
        <label>
          Имя
          <input name="name" defaultValue={site.name} required />
        </label>
        <label>
          Роль
          <input name="role" defaultValue={site.role} required />
        </label>
      </div>
      <label>
        Вордмарк в шапке
        <input name="wordmark" defaultValue={site.wordmark} />
      </label>
      <div className="row">
        <label>
          Локация, строка 1
          <input name="locationLine1" defaultValue={site.locationLine1} />
        </label>
        <label>
          Локация, строка 2
          <input name="locationLine2" defaultValue={site.locationLine2} />
        </label>
      </div>
      <label>
        Часовой пояс — по нему идут часы в футере
        <input
          name="timezone"
          list="timezones"
          placeholder="Europe/Amsterdam"
          defaultValue={site.timezone}
        />
        <datalist id="timezones">
          {zones.map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
      </label>
      <label>
        Заголовок about
        <textarea name="introTitle" defaultValue={site.introTitle} />
      </label>
      <label>
        Текст about
        <textarea name="introBody" defaultValue={site.introBody} />
      </label>
      <div className="row">
        <label>
          Кнопка about
          <input name="introCta" defaultValue={site.introCta} />
        </label>
        <label>
          Кнопка контакта
          <input name="footerCta" defaultValue={site.footerCta} />
        </label>
      </div>
      <label>
        Заголовок футера (перевод строки — новая строка)
        <textarea name="footerTitle" defaultValue={site.footerTitle} />
      </label>
      <div className="row">
        <label>
          Email
          <input type="email" name="email" defaultValue={site.email} required />
        </label>
        <label>
          Title в браузере
          <input name="metaTitle" defaultValue={site.metaTitle} />
        </label>
      </div>
      <label>
        Description
        <textarea name="metaDescription" defaultValue={site.metaDescription} />
      </label>
      <div className="row">
        <label>
          LinkedIn
          <input name="linkedin" defaultValue={site.linkedin} />
        </label>
        <label>
          GitHub
          <input name="github" defaultValue={site.github} />
        </label>
      </div>
      <label>
        Read.cv
        <input name="readcv" defaultValue={site.readcv} />
      </label>
      {state.error ? <p className="admin-error">{state.error}</p> : null}
      {state.ok ? <p className="admin-ok">Сохранено</p> : null}
      <button className="admin-btn" type="submit" disabled={pending}>
        {pending ? 'Сохраняем…' : 'Сохранить тексты'}
      </button>
    </form>
  )
}
