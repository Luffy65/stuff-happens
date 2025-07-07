import dayjs from 'dayjs';

function Footer() {
  return (
    <footer className="bg-dark bg-opacity-75 border-top border-primary mt-auto py-4">
      {/* Quote Section */}
      <div className="bg-dark bg-opacity-50 py-4 text-center">
        <blockquote className="fs-5 text-light mb-3">
          <p className="fst-italic mb-2">
            "The real question is not whether machines think but whether men do."
          </p>
          <footer className="text-info fs-6">
            <cite>B.F. Skinner</cite>
          </footer>
        </blockquote>
      </div>

      {/* Copyright */}
      <div className="text-center pt-3 border-top border-secondary">
        <small className="text-light opacity-75">
          &copy; {dayjs().year()} Game of Misfortune.
        </small>
      </div>
    </footer>
  );
}

export default Footer;