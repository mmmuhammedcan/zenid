import { DEFAULT_ACCENT } from "./themes";
import { markdownLiteToHtml } from "./markdownLite";
import { formatDate, getFilledSections } from "./resumeSections";
import { DEFAULT_SECTION_ORDER } from "./data";

const A4_WIDTH_PT = 595;
const A4_HEIGHT_PT = 842;

function ContactLine({ personalInfo, className, linkClassName }) {
  const location = [personalInfo.city, personalInfo.state].filter(Boolean).join(", ");
  const items = [
    personalInfo.phone,
    personalInfo.email,
    location,
    personalInfo.portfolio && (
      <a key="portfolio" href={personalInfo.portfolio} target="_blank" rel="noopener noreferrer" className={linkClassName}>
        Portfolio
      </a>
    ),
    personalInfo.linkedin && (
      <a key="linkedin" href={personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className={linkClassName}>
        LinkedIn
      </a>
    ),
    personalInfo.github && (
      <a key="github" href={personalInfo.github} target="_blank" rel="noopener noreferrer" className={linkClassName}>
        GitHub
      </a>
    ),
  ].filter(Boolean);

  if (items.length === 0) return null;

  return (
    <div className={className}>
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1">
          {idx > 0 && <span>|</span>}
          {item}
        </span>
      ))}
    </div>
  );
}

function SectionHeading({ children, accentColor, variant }) {
  if (variant === "modern") {
    return (
      <h2
        className="mb-1 border-b-2 text-xs font-bold uppercase tracking-wide"
        style={{ borderColor: accentColor, color: accentColor }}
      >
        {children}
      </h2>
    );
  }
  return (
    <h2 className="border-b border-stone-400 text-xs font-bold uppercase tracking-wide" style={{ color: accentColor }}>
      {children}
    </h2>
  );
}

function DomainsBlock({ items, accentColor, variant }) {
  return (
    <div className={variant === "modern" ? "mb-3" : undefined}>
      <SectionHeading accentColor={accentColor} variant={variant}>
        Domain/Functional Areas
      </SectionHeading>
      <div className="py-1 text-xs text-stone-800">
        {items.map((domain, idx) => (
          <span key={domain.id}>
            {idx > 0 && " • "}
            {domain.text}
          </span>
        ))}
      </div>
    </div>
  );
}

function SkillsBlock({ items, accentColor, variant }) {
  return (
    <div className={variant === "modern" ? "mb-3" : undefined}>
      <SectionHeading accentColor={accentColor} variant={variant}>
        Key Skills
      </SectionHeading>
      <div className="space-y-0.5 py-1">
        {items.map((skill) => (
          <div key={skill.id} className="text-xs">
            <span className="font-semibold">{skill.category}:</span> {skill.items}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExperienceBlock({ items, accentColor, variant }) {
  return (
    <div className={variant === "modern" ? "mb-3" : undefined}>
      <SectionHeading accentColor={accentColor} variant={variant}>
        Professional Experience
      </SectionHeading>
      <div className="space-y-1 py-1">
        {items.map((item) => (
          <div key={item.id} className="text-xs">
            <div className="flex justify-between gap-2">
              <div className="flex-1">
                <p className="font-semibold text-stone-900">{item.role}</p>
                <p className="text-stone-700">{item.company}</p>
                {item.tools && <p className="italic text-stone-600">Tools: {item.tools}</p>}
              </div>
              <p className="shrink-0 text-stone-600">
                {formatDate(item.startDate)} – {item.isCurrentlyWorking ? "Present" : formatDate(item.endDate)}
              </p>
            </div>
            {item.description && (
              <ul className="ml-2 list-disc space-y-0 py-0.5 text-stone-700">
                {item.description.split("\n").filter(Boolean).map((line, idx) => (
                  <li key={idx} className="leading-snug">
                    {line.trim()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectsBlock({ items, accentColor, variant }) {
  return (
    <div className={variant === "modern" ? "mb-3" : undefined}>
      <SectionHeading accentColor={accentColor} variant={variant}>
        Projects
      </SectionHeading>
      <div className="space-y-1 py-1">
        {items.map((project) => (
          <div key={project.id} className="text-xs">
            <div className="flex justify-between gap-2">
              <div className="flex-1">
                <p className="font-semibold text-stone-900">
                  {project.name}
                  {project.techStack && <span className="font-normal text-stone-700"> | {project.techStack}</span>}
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 font-normal text-blue-600"
                    >
                      [Link]
                    </a>
                  )}
                </p>
              </div>
              {(project.startDate || project.endDate) && (
                <p className="shrink-0 text-stone-600">
                  {formatDate(project.startDate)} – {project.isCurrentProject ? "Present" : formatDate(project.endDate)}
                </p>
              )}
            </div>
            {project.description && (
              <ul className="ml-2 list-disc space-y-0 py-0.5 text-stone-700">
                {project.description.split("\n").filter(Boolean).map((line, idx) => (
                  <li key={idx} className="leading-snug">
                    {line.trim()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AchievementsBlock({ items, accentColor, variant }) {
  return (
    <div className={variant === "modern" ? "mb-3" : undefined}>
      <SectionHeading accentColor={accentColor} variant={variant}>
        Achievements
      </SectionHeading>
      <div className="space-y-1 py-1">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between gap-2 text-xs">
            <div className="flex-1">
              <p className="font-semibold text-stone-900">{item.title}</p>
              {item.description && <p className="leading-snug text-stone-700">{item.description}</p>}
            </div>
            {item.date && <p className="shrink-0 text-stone-600">{item.date}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function CertificationsBlock({ items, accentColor, variant }) {
  return (
    <div className={variant === "modern" ? "mb-3" : undefined}>
      <SectionHeading accentColor={accentColor} variant={variant}>
        Certifications
      </SectionHeading>
      <div className="space-y-1 py-1">
        {items.map((cert) => (
          <div key={cert.id} className="flex justify-between gap-2 text-xs">
            <div className="flex-1">
              <p className="font-semibold text-stone-900">
                {cert.title}
                {cert.link && (
                  <a
                    href={cert.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 font-normal text-blue-600"
                  >
                    [Link]
                  </a>
                )}
              </p>
              {cert.issuer && <p className="text-stone-700">{cert.issuer}</p>}
            </div>
            {cert.date && <p className="shrink-0 text-stone-600">{cert.date}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function EducationBlock({ items, accentColor, variant }) {
  return (
    <div className={variant === "modern" ? "mb-3" : undefined}>
      <SectionHeading accentColor={accentColor} variant={variant}>
        Education
      </SectionHeading>
      <div className="space-y-1 py-1">
        {items.map((edu) => (
          <div key={edu.id} className="flex justify-between gap-2 text-xs">
            <div className="flex-1">
              <p className="font-semibold text-stone-900">
                {edu.degree} {edu.field && `in ${edu.field}`}
              </p>
              <p className="text-stone-700">{edu.institution}</p>
              {edu.gpa && <p className="text-stone-600">GPA: {edu.gpa}</p>}
            </div>
            {(edu.startDate || edu.endDate) && (
              <p className="shrink-0 text-stone-600">
                {formatDate(edu.startDate)} – {edu.isCurrentlyStudying ? "Present" : formatDate(edu.endDate)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdditionalBlock({ data, accentColor, variant }) {
  return (
    <div className={variant === "modern" ? "mb-3" : undefined}>
      <SectionHeading accentColor={accentColor} variant={variant}>
        {data.title}
      </SectionHeading>
      <div
        className="py-1 text-xs text-stone-800"
        style={{ lineHeight: "1.4" }}
        dangerouslySetInnerHTML={{ __html: markdownLiteToHtml(data.content) }}
      />
      {data.link && (
        <p className="py-0.5 text-xs text-blue-600">
          <a href={data.link} target="_blank" rel="noopener noreferrer">
            {data.link}
          </a>
        </p>
      )}
    </div>
  );
}

// Renders whichever of the reorderable sections actually have content, in the
// order the user configured (resumeData.sectionOrder), for a given key set.
function OrderedSections({ sectionKeys, resumeData, filled, accentColor, variant }) {
  const order = resumeData.sectionOrder && resumeData.sectionOrder.length ? resumeData.sectionOrder : DEFAULT_SECTION_ORDER;
  const visibleOrder = order.filter((key) => sectionKeys.includes(key));

  return visibleOrder.map((key) => {
    switch (key) {
      case "domains":
        return filled.domains.length > 0 && (
          <DomainsBlock key={key} items={filled.domains} accentColor={accentColor} variant={variant} />
        );
      case "skills":
        return filled.skills.length > 0 && (
          <SkillsBlock key={key} items={filled.skills} accentColor={accentColor} variant={variant} />
        );
      case "experience":
        return filled.experience.length > 0 && (
          <ExperienceBlock key={key} items={filled.experience} accentColor={accentColor} variant={variant} />
        );
      case "projects":
        return filled.projects.length > 0 && (
          <ProjectsBlock key={key} items={filled.projects} accentColor={accentColor} variant={variant} />
        );
      case "achievements":
        return filled.achievements.length > 0 && (
          <AchievementsBlock key={key} items={filled.achievements} accentColor={accentColor} variant={variant} />
        );
      case "certifications":
        return filled.certifications.length > 0 && (
          <CertificationsBlock key={key} items={filled.certifications} accentColor={accentColor} variant={variant} />
        );
      case "education":
        return filled.education.length > 0 && (
          <EducationBlock key={key} items={filled.education} accentColor={accentColor} variant={variant} />
        );
      case "additionalSection":
        return filled.hasAdditional && (
          <AdditionalBlock key={key} data={resumeData.additionalSection} accentColor={accentColor} variant={variant} />
        );
      default:
        return null;
    }
  });
}

function MinimalLayout({ resumeData, accentColor }) {
  const personalInfo = resumeData.personalInfo || {};
  const filled = getFilledSections(resumeData);
  const allKeys = ["domains", "skills", "experience", "projects", "achievements", "certifications", "education", "additionalSection"];

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto p-8 font-system text-xs text-stone-900">
      <div className="mb-1 border-b-2" style={{ borderColor: accentColor }}>
        <h1 className="text-xl font-bold" style={{ color: accentColor }}>
          {personalInfo.fullName}
        </h1>
        {personalInfo.title && <p className="text-xs font-medium text-stone-600">{personalInfo.title}</p>}
        <ContactLine
          personalInfo={personalInfo}
          className="mt-0.5 flex flex-wrap gap-1.5 text-xs text-stone-700"
          linkClassName="text-blue-600"
        />
      </div>

      {personalInfo.summary && (
        <div className="mb-1">
          <p className="leading-snug text-stone-800">{personalInfo.summary}</p>
        </div>
      )}

      <OrderedSections
        sectionKeys={allKeys}
        resumeData={resumeData}
        filled={filled}
        accentColor={accentColor}
        variant="minimal"
      />
    </div>
  );
}

function ModernLayout({ resumeData, accentColor }) {
  const personalInfo = resumeData.personalInfo || {};
  const filled = getFilledSections(resumeData);
  const mainKeys = ["experience", "projects", "achievements", "certifications", "education", "additionalSection"];

  return (
    <div className="flex h-full">
      <div className="flex w-2/5 flex-col gap-3 overflow-y-auto p-6 text-white" style={{ backgroundColor: accentColor }}>
        <div>
          <h1 className="text-lg font-bold">{personalInfo.fullName}</h1>
          <p className="text-xs text-white/80">{personalInfo.title}</p>
        </div>

        <div className="space-y-2 text-xs text-white/90">
          {personalInfo.email && (
            <div>
              <p className="font-semibold text-white/60">Email</p>
              <p className="break-all">{personalInfo.email}</p>
            </div>
          )}
          {personalInfo.phone && (
            <div>
              <p className="font-semibold text-white/60">Phone</p>
              <p>{personalInfo.phone}</p>
            </div>
          )}
          {(personalInfo.city || personalInfo.state) && (
            <div>
              <p className="font-semibold text-white/60">Location</p>
              <p>{[personalInfo.city, personalInfo.state].filter(Boolean).join(", ")}</p>
            </div>
          )}
          {personalInfo.portfolio && (
            <div>
              <p className="font-semibold text-white/60">Portfolio</p>
              <a href={personalInfo.portfolio} target="_blank" rel="noopener noreferrer" className="break-all underline">
                {personalInfo.portfolio}
              </a>
            </div>
          )}
          {personalInfo.linkedin && (
            <div>
              <p className="font-semibold text-white/60">LinkedIn</p>
              <a href={personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="break-all underline">
                {personalInfo.linkedin}
              </a>
            </div>
          )}
          {personalInfo.github && (
            <div>
              <p className="font-semibold text-white/60">GitHub</p>
              <a href={personalInfo.github} target="_blank" rel="noopener noreferrer" className="break-all underline">
                {personalInfo.github}
              </a>
            </div>
          )}
        </div>

        {personalInfo.summary && (
          <div className="border-t border-white/20 pt-2">
            <p className="text-xs leading-snug text-white/90">{personalInfo.summary}</p>
          </div>
        )}

        {filled.domains.length > 0 && (
          <div className="border-t border-white/20 pt-2">
            <h3 className="mb-1 text-xs font-semibold text-white">Domain/Functional Areas</h3>
            <p className="text-xs leading-snug text-white/90">{filled.domains.map((d) => d.text).join(" • ")}</p>
          </div>
        )}

        {filled.skills.length > 0 && (
          <div className="border-t border-white/20 pt-2">
            <h3 className="mb-1 text-xs font-semibold text-white">Key Skills</h3>
            <div className="space-y-0.5 text-xs text-white/90">
              {filled.skills.map((skill) => (
                <div key={skill.id}>
                  <p className="font-semibold text-white/70">{skill.category}</p>
                  <p>{skill.items}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 text-stone-900">
        <OrderedSections
          sectionKeys={mainKeys}
          resumeData={resumeData}
          filled={filled}
          accentColor={accentColor}
          variant="modern"
        />
      </div>
    </div>
  );
}

export default function ResumePreview({ template, resumeData, accentColor = DEFAULT_ACCENT }) {
  return (
    <div
      className="mx-auto overflow-hidden rounded-md bg-stone-100 ring-1 ring-stone-900/10"
      style={{ width: A4_WIDTH_PT, height: A4_HEIGHT_PT, boxShadow: "0 0 60px -15px rgba(0, 0, 0, 0.7)" }}
    >
      {template === "modern" ? (
        <ModernLayout resumeData={resumeData} accentColor={accentColor} />
      ) : (
        <MinimalLayout resumeData={resumeData} accentColor={accentColor} />
      )}
    </div>
  );
}
