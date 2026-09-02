import type { FormEvent } from 'react'
import { useForm, usePage } from '@inertiajs/react'
import { useT } from '~/lib/i18n'

type BriefingFormData = {
  name: string
  company: string
  email: string
  phone: string
  service_type: 'arquitetura' | 'projeto' | 'suporte'
  budget_range: '' | 't1' | 't2' | 't3' | 't4'
  message: string
  // Honeypot: só um bot preenche um campo fora da tela. O controller descarta
  // o envio em silêncio quando isso chega preenchido — ver briefings_controller.ts.
  website: string
}

const EMPTY: BriefingFormData = {
  name: '',
  company: '',
  email: '',
  phone: '',
  service_type: 'arquitetura',
  budget_range: '',
  message: '',
  website: '',
}

export default function BriefingForm() {
  const t = useT()
  const { flash } = usePage()
  const sent = flash?.briefing === 'sent'

  const form = useForm<BriefingFormData>(EMPTY)

  function submit(e: FormEvent) {
    e.preventDefault()
    form.post('/briefing', {
      preserveScroll: true,
      onSuccess: () => form.reset(),
    })
  }

  return (
    <section className="sec blk-briefing" id="briefing">
      <div className="shell">
        <div className="brief rise">
          <div className="sec-head" style={{ marginBottom: 26 }}>
            <p className="eyebrow">{t('b.eyebrow')}</p>
            <h2>{t('b.h2')}</h2>
            <p className="lede">{t('b.lede')}</p>
          </div>

          {!sent && (
            <form className="form" onSubmit={submit} noValidate>
              <div className={form.errors.name ? 'field has-error' : 'field'}>
                <label htmlFor="f-name">{t('b.name')}</label>
                <input
                  id="f-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={form.data.name}
                  onChange={(e) => form.setData('name', e.target.value)}
                />
                {form.errors.name && <span className="field-error">{form.errors.name}</span>}
              </div>

              <div className={form.errors.company ? 'field has-error' : 'field'}>
                <label htmlFor="f-company">{t('b.company')}</label>
                <input
                  id="f-company"
                  name="company"
                  type="text"
                  required
                  autoComplete="organization"
                  value={form.data.company}
                  onChange={(e) => form.setData('company', e.target.value)}
                />
                {form.errors.company && <span className="field-error">{form.errors.company}</span>}
              </div>

              <div className={form.errors.email ? 'field has-error' : 'field'}>
                <label htmlFor="f-email">{t('b.email')}</label>
                <input
                  id="f-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.data.email}
                  onChange={(e) => form.setData('email', e.target.value)}
                />
                {form.errors.email && <span className="field-error">{form.errors.email}</span>}
              </div>

              <div className={form.errors.phone ? 'field has-error' : 'field'}>
                <label htmlFor="f-phone" dangerouslySetInnerHTML={{ __html: t('b.phone') }} />
                <input
                  id="f-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.data.phone}
                  onChange={(e) => form.setData('phone', e.target.value)}
                />
                {form.errors.phone && <span className="field-error">{form.errors.phone}</span>}
              </div>

              <div className={form.errors.service_type ? 'field has-error' : 'field'}>
                <label htmlFor="f-service">{t('b.service')}</label>
                <select
                  id="f-service"
                  name="service_type"
                  required
                  value={form.data.service_type}
                  onChange={(e) =>
                    form.setData('service_type', e.target.value as BriefingFormData['service_type'])
                  }
                >
                  <option value="arquitetura">{t('b.opt.arch')}</option>
                  <option value="projeto">{t('b.opt.proj')}</option>
                  <option value="suporte">{t('b.opt.sup')}</option>
                </select>
                {form.errors.service_type && (
                  <span className="field-error">{form.errors.service_type}</span>
                )}
              </div>

              <div className={form.errors.budget_range ? 'field has-error' : 'field'}>
                <label htmlFor="f-budget" dangerouslySetInnerHTML={{ __html: t('b.budget') }} />
                <select
                  id="f-budget"
                  name="budget_range"
                  value={form.data.budget_range}
                  onChange={(e) =>
                    form.setData('budget_range', e.target.value as BriefingFormData['budget_range'])
                  }
                >
                  <option value="">{t('b.bud.none')}</option>
                  <option value="t1">{t('b.bud.1')}</option>
                  <option value="t2">{t('b.bud.2')}</option>
                  <option value="t3">{t('b.bud.3')}</option>
                  <option value="t4">{t('b.bud.4')}</option>
                </select>
                {form.errors.budget_range && (
                  <span className="field-error">{form.errors.budget_range}</span>
                )}
              </div>

              <div className={form.errors.message ? 'field wide has-error' : 'field wide'}>
                <label htmlFor="f-msg">{t('b.problem')}</label>
                <textarea
                  id="f-msg"
                  name="message"
                  required
                  placeholder={t('b.ph')}
                  value={form.data.message}
                  onChange={(e) => form.setData('message', e.target.value)}
                />
                {form.errors.message && <span className="field-error">{form.errors.message}</span>}
              </div>

              <div className="hp" aria-hidden="true">
                <label htmlFor="f-site">Do not fill this field</label>
                <input
                  id="f-site"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.data.website}
                  onChange={(e) => form.setData('website', e.target.value)}
                />
              </div>

              <div className="form-foot">
                <button className="btn" type="submit" disabled={form.processing}>
                  {t('b.submit')}
                </button>
                <span className="form-note">{t('b.sla')}</span>
              </div>
            </form>
          )}

          {sent && (
            <div className="sent on">
              <span className="sent-mark" />
              <div>
                <h3>{t('b.sent.h')}</h3>
                <p>{t('b.sent.p')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
