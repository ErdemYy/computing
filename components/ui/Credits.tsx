import { ASSET_LIST } from '@/data/assets'

/** Model credits, generated from data/assets.ts. Unverified fields are shown honestly. */
export function Credits() {
  return (
    <section id="credits" className="credits" aria-labelledby="credits-title">
      <div className="editorial-wrap">
        <p className="eyebrow">CREDITS</p>
        <h2 id="credits-title" className="editorial-h2">
          3D models
        </h2>
        <p className="credits-note" lang="en">
          The 3D models in this experience are third-party assets and belong to their creators. They are credited below
          and are not presented as the work of this project. Entries marked “to be confirmed” still need the creator and
          licence copied from the model&apos;s source page.
        </p>
        <ul className="credits-list">
          {ASSET_LIST.map((a) => (
            <li key={a.id}>
              <span className="credits-name">{a.name}</span>
              <dl>
                <div>
                  <dt>Creator</dt>
                  <dd>{a.author ?? <em>to be confirmed</em>}</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>{a.source}</dd>
                </div>
                <div>
                  <dt>License</dt>
                  <dd>{a.license ?? <em>to be confirmed</em>}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
