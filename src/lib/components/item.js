import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const GalleryItem = React.forwardRef((props, ref) => {
  const cls = classnames({
    'scroll-item': true,
    activated: props.activated
  });

  const { transform } = props;

  const style = {
    transform: `translate3d(${transform}px, 0, 0)`
  };

  return (
    <div className={cls} style={style} ref={ref}>
      {props.children}
    </div>
  );
});

GalleryItem.propTypes = {
  activated: PropTypes.bool
};

GalleryItem.defaultProps = {
  activated: false
};

export default GalleryItem;
