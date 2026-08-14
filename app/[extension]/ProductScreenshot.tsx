import Image from "next/image";

export default function ProductScreenshot({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <figure className="extension-gallery">
      <div className="gallery-frame">
        <Image
          className="gallery-thumbnail"
          src={src}
          alt={alt}
          width={1280}
          height={800}
          sizes="(max-width: 860px) 100vw, 760px"
          priority
        />
      </div>
    </figure>
  );
}
