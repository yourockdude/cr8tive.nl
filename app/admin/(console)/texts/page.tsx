import { TextsForm } from '@/app/admin/(console)/texts/texts-form'
import { readSite } from '@/lib/content'

export default async function TextsPage() {
  const site = await readSite()

  return (
    <>
      <p className="tiny">Copy</p>
      <h1>Тексты</h1>
      <p className="admin-lead">
        Фото hero, тексты главной, шапка, about, футер и метаданные.
      </p>
      <TextsForm site={site} />
    </>
  )
}
