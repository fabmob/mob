import React, { FC } from 'react';
import Img, { FixedObject, FluidObject } from 'gatsby-image';
import { useStaticQuery, graphql } from 'gatsby';
import classNames from 'classnames';

import './_image.scss';

interface ImageProps {
  // filename : must match filename with extension in '../assets/images' folder, i.e. : 'girl-bike.jpg'
  filename?: string;
  // alt tag for image
  alt?: string;
  // fixed or fluid ? default fluid if undefined.
  fixed?: boolean;

  verticalAlign?: 'top' | 'middle' | 'bottom';

  size?: 'mini' | 'tiny' | 'medium';
}

interface PureImageProps extends ImageProps {
  // data from graphQL query
  images: ImageQuery;
  className?: string;
}

interface Edge {
  node: {
    childImageSharp: {
      fluid: FluidObject;
      fixed: FixedObject;
    };
    extension: string;
    publicURL: string;
    relativePath: string;
  };
}

interface ImageQuery {
  data: {
    edges: Edge[];
  };
}

/**
 * Pure component for easier testing without graphQL context
 * @param image
 * @param alt
 * @param fixed
 * @constructor
 */
export const PureImage: FC<PureImageProps> = ({
  images,
  filename,
  alt,
  fixed,
  className,
}) => {
  // We find the image through all the images with filename
  const image = images.data.edges.find((edge: Edge) => {
    return edge.node.relativePath.includes(filename as string);
  });

  if (!image) {
    return null;
  }

  const {
    node: { extension, publicURL },
  } = image;

  // svg support
  if (extension === 'svg') {
    return <img src={publicURL} alt={alt} className={className} />;
  }

  if (fixed) {
    return (
      <Img
        alt={alt}
        fixed={image.node.childImageSharp.fixed}
        className={className}
      />
    );
  }

  return (
    <Img
      alt={alt}
      fluid={image.node.childImageSharp.fluid}
      className={className}
    />
  );
};

/**
 * Image component which returns a Gatsby Image, using a filename to filter through all the images in the specified folder(s)
 * @param filename
 * @param alt
 * @param fixed
 * @constructor
 */
const Image: FC<ImageProps> = ({
  filename = 'no-image.svg',
  alt = '',
  fixed = false,
  verticalAlign,
  size,
}) => {
  const classes = classNames('mcm-image', {
    [`${verticalAlign}`]: verticalAlign !== undefined,
    [`${size}`]: size !== undefined,
  });
  // sourceInstanceName = "images" : filtering images from gatsby-source-filesystem (name : "images")
  const images: ImageQuery = useStaticQuery(graphql`
    query ImageQuery {
      data: allFile(filter: { sourceInstanceName: { eq: "images" } }) {
        edges {
          node {
            relativePath
            childImageSharp {
              fluid(quality: 100) {
                ...GatsbyImageSharpFluid
              }
              fixed(quality: 100) {
                ...GatsbyImageSharpFixed
              }
            }
            extension
            publicURL
          }
        }
      }
    }
  `);

  return (
    <PureImage
      images={images}
      filename={filename}
      alt={alt}
      fixed={fixed}
      className={classes}
    />
  );
};

export default Image;
