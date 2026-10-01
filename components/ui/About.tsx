/** Normal editorial section: leaves the 3D world and reads like a magazine page. */
export function About() {
  return (
    <section id="about" className="about" aria-labelledby="about-title">
      <div className="editorial-wrap">
        <p className="eyebrow">ABOUT</p>
        <h2 id="about-title" className="about-title">
          THE STORY
          <br />
          IS STILL MOVING.
        </h2>
        <div className="about-grid" lang="en">
          <p className="about-lead">
            Computing did not arrive as one invention. It moved through forms — each one smaller, closer and more
            connected than the last.
          </p>
          <div className="about-body">
            <p>
              It began with <strong>mechanical systems</strong>: gears and precision engineering carrying the first idea
              of a programmable machine. Then came <strong>electronic machines</strong> that filled rooms and served
              whole institutions.
            </p>
            <p>
              The <strong>microprocessor</strong> collapsed that scale onto a single chip, and the{' '}
              <strong>personal computer</strong> carried it into homes, schools and desks. Screens learned to speak in
              pictures, and machines learned to speak to each other.
            </p>
            <p>
              Today the computer is a <strong>network</strong> — distributed across data centers and specialized
              hardware, running <strong>artificial intelligence</strong> that no single box contains. What comes next
              may not look like a computer at all.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
