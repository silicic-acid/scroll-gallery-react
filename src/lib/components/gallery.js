import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import GalleryItem from './item';
import { isTouchEvent, bounceFunctionFactory } from './utils';

class ScrollGallery extends React.Component {
  slackEl = null;
  itemElements = [];
  startOffsets = [];
  pointerPosition = { x: 0, y: 0 };
  isTriggering = false;
  displayTranslate = 0;
  passiveTranslate = 0;
  draggingDiff = 0;

  bounceFunction = x => x;

  constructor() {
    super();

    this.state = {
      activatedItemIndex: 0,
      animated: false,
      isDragging: false,
      isTransitioning: false,
      itemTranslates: [],
      startOffsets: [],
      trackWidth: 0,
      translate: 0
    };
  }

  componentDidMount() {
    this.prepareGallery();

    Promise.resolve().then(() => {
      this.setState({
        animated: true
      });
      this.moveTrack(this.getActivatedItemOffset(0));
    });
  }

  componentWillUnmount() {
    this.itemElements = [];
  }

  bindWindowResizingEvent = () => {};

  onPointerDown = e => {
    if (!this.isTriggering) {
      const point = isTouchEvent(e) ? e.touches[0] || e.changedTouches[0] : e;

      this.isTriggering = true;
      this.pointerPosition = { x: point.clientX, y: point.clientY };
      document.addEventListener('mousemove', this.onPointerMove);
      document.addEventListener('touchmove', this.onPointerMove);
      document.addEventListener('mouseup', this.onPointerUp);
      document.addEventListener('touchend', this.onPointerUp);
    }
  };

  onPointerMove = e => {
    const point = isTouchEvent(e) ? e.touches[0] || e.changedTouches[0] : e;
    const delta = (this.pointerDelta = {
      x: point.clientX - this.pointerPosition.x,
      y: point.clientY - this.pointerPosition.y
    });

    const { isDragging: dragging } = this.state;

    let isDragging = false;

    if (Math.abs(delta.x) > 5) {
      if (!dragging) {
        isDragging = true;
        this.draggingDiff = this.displayTranslate - this.passiveTranslate;
        this.setState({
          activatedItemIndex: -1,
          isDragging
        });
      }
    }

    if (dragging) {
      this.activeTranslate = this.passiveTranslate + delta.x;
      this.moveTrack(
        this.bounceFunction(this.activeTranslate) + this.draggingDiff
      );
    }
  };

  onPointerUp = () => {
    const { isDragging } = this.state;

    if (isDragging) {
      this.setState({
        isDragging: false
      });

      const nearestItemIndex = this.getActivatedItemForOffset(
        this.activeTranslate,
        this.activeTranslate < this.passiveTranslate ? 'left' : 'right'
      );

      this.animateToItemAtIndex(nearestItemIndex).then(ok => {
        this.passiveTranslate = -this.startOffsets[nearestItemIndex];
        this.setState({
          activatedItemIndex: nearestItemIndex,
          isTransitioning: false
        });
      });
    }

    document.removeEventListener('mousemove', this.onPointerMove);
    document.removeEventListener('touchmove', this.onPointerMove);
    document.removeEventListener('mouseup', this.onPointerUp);
    document.removeEventListener('touchend', this.onPointerUp);

    this.isTriggering = false;
  };

  prepareGallery = () => {
    let width = 0;
    let lastItemWidth = 0;

    const elements = this.itemElements;
    const length = elements.length;
    const { gap } = this.props;
    const itemTranslates = [];

    this.startOffsets = [];

    elements.forEach((el, index) => {
      const itemWidth = el.clientWidth;

      this.startOffsets.push(width);
      width = width + itemWidth + gap;

      if (index === length - 1) {
        lastItemWidth = itemWidth;
      }

      itemTranslates[index] = gap * index;
    });

    const trackWidth = width - gap;

    this.setState({
      trackWidth,
      itemTranslates
    });

    this.bounceFunction = bounceFunctionFactory(
      0,
      trackWidth - lastItemWidth,
      this.props.bounceRate
    );
  };

  moveTrack = translate => {
    this.displayTranslate = translate;
    this.setState({
      translate
    });
  };

  animateToItemAtIndex = index => {
    return new Promise(res => {
      this.moveTrack(this.getActivatedItemOffset(index));
      this.setState({ isTransitioning: true });
      setTimeout(() => {
        res();
      }, 300);
    });
  };

  getActivatedItemOffset = index => {
    if (this.startOffsets.length <= index) {
      throw new Error(`Cannot access item at index ${index}`);
    }

    const { activatedItemPosition } = this.props;
    const offset = -this.startOffsets[index];

    if (activatedItemPosition === 'center') {
      // When the activated item should be aligned to center;
      const slackWidth = this.slackEl.clientWidth;
      const itemWidth = this.itemElements[index].clientWidth;
      return offset + (slackWidth - itemWidth) / 2;
    } else {
      return offset + activatedItemPosition;
    }
  };

  getActivatedItemForOffset = (translate, direction) => {
    const parsedTranslate = -translate;
    const elements = this.itemElements;
    const length = elements.length;

    let firstFurtherIndex = 0;

    while (
      this.startOffsets[firstFurtherIndex] < parsedTranslate &&
      firstFurtherIndex < length
    ) {
      firstFurtherIndex++;
    }

    if (firstFurtherIndex === 0) {
      return firstFurtherIndex;
    }

    if (firstFurtherIndex === length) {
      return firstFurtherIndex - 1;
    }

    const leftOffset = this.startOffsets[firstFurtherIndex - 1];
    const rightOffset = this.startOffsets[firstFurtherIndex];
    const leftItemWidth = elements[firstFurtherIndex - 1].clientWidth;
    const rightItemWidth = elements[firstFurtherIndex - 1].clientWidth;

    if (direction === 'left' && parsedTranslate > leftOffset + leftItemWidth) {
      return firstFurtherIndex;
    } else if (
      direction === 'right' &&
      parsedTranslate < rightOffset - rightItemWidth
    ) {
      return firstFurtherIndex - 1;
    } else {
      const toLeft = parsedTranslate - (leftOffset + leftItemWidth);
      const toRight = rightOffset - parsedTranslate;
      return toLeft < toRight ? firstFurtherIndex - 1 : firstFurtherIndex;
    }
  };

  render = () => {
    const { children } = this.props;
    const {
      animated,
      itemTranslates,
      trackWidth: width,
      translate,
      isDragging,
      isTransitioning
    } = this.state;

    const slackCls = classnames({
      'scroll-slack': true,
      animated
    });

    const trackStl = {
      width,
      transform: `translate3d(${translate}px, 0, 0)`
    };

    const trackCls = classnames({
      'scroll-track': true,
      dragging: isDragging,
      transitioning: isTransitioning
    });

    return (
      <div
        className={slackCls}
        ref={el => (this.slackEl = el)}
        onMouseDown={e => this.onPointerDown(e)}
        onTouchStart={e => this.onPointerDown(e)}
      >
        <div className={trackCls} style={trackStl}>
          {children.map((child, index) => {
            const activated = this.state.activatedItemIndex === index;
            return (
              <GalleryItem
                activated={activated}
                transform={itemTranslates[index]}
                key={index}
                ref={el => (this.itemElements[index] = el)}
              >
                {child}
              </GalleryItem>
            );
          })}
        </div>
      </div>
    );
  };
}

ScrollGallery.propTypes = {
  gap: PropTypes.number,
  scaleRate: PropTypes.number,
  activatedItemPosition: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.oneOf(['center'])
  ]),
  bounceRate: PropTypes.number,
  activatedChanges: PropTypes.func,
  draggingStarted: PropTypes.func,
  dragging: PropTypes.func,
  draggingEnd: PropTypes.func
};

ScrollGallery.defaultProps = {
  gap: 120,
  scaleRate: 1.2,
  activatedItemPosition: 100,
  bounceRate: 100
};

// Make an alias.
ScrollGallery.Item = GalleryItem;

export default ScrollGallery;
