import React from 'react';

import { storiesOf } from '@storybook/react';
// import { action } from '@storybook/addon-actions';
// import { linkTo } from '@storybook/addon-links';

import '../lib/styles.scss';
import './styles.scss';
import { ScrollGallery } from '../lib';

storiesOf('Gallery', module).add('Basic', () => {
  return (
    <>
      <ScrollGallery activatedItemPosition="center">
        <div className="item">a</div>
        <div className="item">b</div>
        <div className="item">c</div>
        <div className="item">d</div>
        <div className="item">e</div>
      </ScrollGallery>
      <div style={{ height: 300 }}>A</div>
      <div style={{ height: 300 }}>A</div>
      <div style={{ height: 300 }}>A</div>
    </>
  );
});
