/**
 * Copyright (c) 2015-present, Pavel Aksonov
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import React, {
  Component,
  PropTypes,
} from 'react';
import {
  Animated,
  View,
  StyleSheet,
} from 'react-native';

import TabBar from './TabBar';
import NavBar from './NavBar';
import Actions from './Actions';
import { deepestExplicitValueForKey } from './Util';
import NavigationExperimental from 'react-native-experimental-navigation';
const {
  AnimatedView: NavigationAnimatedView,
  Card: NavigationCard,
  CardStack
} = NavigationExperimental;

const {
  CardStackPanResponder: NavigationCardStackPanResponder,
  CardStackStyleInterpolator: NavigationCardStackStyleInterpolator,
} = NavigationCard;

const styles = StyleSheet.create({
  animatedView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  sceneStyle: {
    flex: 1,
  },
});

export default class DefaultRenderer extends Component {

  static propTypes = {
    navigationState: PropTypes.object,
    onNavigate: PropTypes.func,
  };

  static childContextTypes = {
    navigationState: PropTypes.any,
  };

  constructor(props) {
    super(props);

    this.renderCard = this.renderCard.bind(this);
    this.renderScene = this.renderScene.bind(this);
    this.renderHeader = this.renderHeader.bind(this);
  }

  getChildContext() {
    return {
      navigationState: this.props.navigationState,
    };
  }

  componentDidMount() {
    this.dispatchFocusAction(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.navigationState !== this.props.navigationState) {
      this.dispatchFocusAction(nextProps);
    }
  }

  dispatchFocusAction({ navigationState }) {
    if (!navigationState || navigationState.component || navigationState.tabs) {
      return;
    }
    const scene = navigationState.routes[navigationState.index];
    Actions.focus({ scene });
  }

  renderCard(/* NavigationSceneRendererProps */ props) {
    console.log("SCENE:", JSON.stringify(props.scene));
    const { key, direction, getSceneStyle } = props.scene;
    let { panHandlers, animationStyle } = props.scene;

    const state = props.navigationState;
    const child = state.routes[state.index];
    let selected = state.routes[state.index];
    while (selected.hasOwnProperty('routes')) {
      selected = selected.routes[selected.index];
    }
    const isActive = child === selected;
    const computedProps = { isActive };
    if (isActive) {
      computedProps.hideNavBar = deepestExplicitValueForKey(props.navigationState, 'hideNavBar');
      computedProps.hideTabBar = deepestExplicitValueForKey(props.navigationState, 'hideTabBar');
    }

    const style = getSceneStyle ? getSceneStyle(props, computedProps) : null;

    const isVertical = direction === 'vertical';

    if (typeof(animationStyle) === 'undefined') {
      animationStyle = (isVertical ?
        NavigationCardStackStyleInterpolator.forVertical(props) :
        NavigationCardStackStyleInterpolator.forHorizontal(props));
    }

    if (typeof(panHandlers) === 'undefined') {
      panHandlers = panHandlers || (isVertical ?
          NavigationCardStackPanResponder.forVertical(props) :
          NavigationCardStackPanResponder.forHorizontal(props));
    }
    return (
      <NavigationCard
        {...props}
        key={`card_${key}`}
        style={[animationStyle, style]}
        panHandlers={panHandlers}
        onNavigateBack={props.onNavigate}
        renderScene={this.renderScene}
      />
    );
  }

  renderScene(/* NavigationSceneRendererProps */ props) {
    return (
      <DefaultRenderer
        key={props.scene.key}
        onNavigate={this.props.onNavigate}
        navigationState={props.scene.route}
      />
    );
  }

  renderHeader(/* NavigationSceneRendererProps */ props) {
    return null;
    //const state = props.scene.route;
    // const child = state.routes[state.index];
    // let selected = state.routes[state.index];
    // while (selected.hasOwnProperty('routes')) {
    //   selected = selected.routes[selected.index];
    // }
    // if (child !== selected) {
    //   // console.log(`SKIPPING renderHeader because ${child.key} !== ${selected.key}`);
    //   return null;
    // }
    // const hideNavBar = deepestExplicitValueForKey(state, 'hideNavBar');
    // if (hideNavBar) {
    //   // console.log(`SKIPPING renderHeader because ${child.key} hideNavBar === true`);
    //   return null;
    // }
    //
    // // console.log(`renderHeader for ${child.key}`);
    //
    // if (selected.component && selected.component.renderNavigationBar) {
    //   return selected.component.renderNavigationBar({ ...props, ...selected });
    // }
    //
    // const HeaderComponent = selected.navBar || child.navBar || state.navBar || NavBar;
    // const navBarProps = { ...state, ...child, ...selected };
    //
    // if (selected.component && selected.component.onRight) {
    //   navBarProps.onRight = selected.component.onRight;
    // }
    //
    // if (selected.component && selected.component.onLeft) {
    //   navBarProps.onLeft = selected.component.onLeft;
    // }
    //
    // if ((navBarProps.leftTitle || navBarProps.leftButtonImage) && navBarProps.onLeft) {
    //   delete navBarProps.leftButton;
    // }
    //
    // if ((navBarProps.rightTitle || navBarProps.rightButtonImage) && navBarProps.onRight) {
    //   delete navBarProps.rightButton;
    // }
    //
    // if (navBarProps.rightButton) {
    //   delete navBarProps.rightTitle;
    //   delete navBarProps.onRight;
    //   delete navBarProps.rightButtonImage;
    // }
    //
    // if (navBarProps.leftButton) {
    //   delete navBarProps.leftTitle;
    //   delete navBarProps.onLeft;
    //   delete navBarProps.leftButtonImage;
    // }
    // delete navBarProps.style;
    //
    // const getTitle = selected.getTitle || (opts => opts.title);
    // return <HeaderComponent {...props} {...navBarProps} getTitle={getTitle} />;
  }

  render() {
    const { navigationState, onNavigate } = this.props;

    if (!navigationState || !onNavigate) {
      console.error('navigationState and onNavigate property should be not null');
      return null;
    }

    let SceneComponent = navigationState.component;

    if (navigationState.tabs && !SceneComponent) {
      SceneComponent = TabBar;
    }

    if (SceneComponent) {
      return (
        <View
          style={[styles.sceneStyle, navigationState.sceneStyle]}
        >
          <SceneComponent {...this.props} {...navigationState} />
        </View>
      );
    }

    const optionals = {};

    const selected = navigationState.routes[navigationState.index];
    const applyAnimation = selected.applyAnimation || navigationState.applyAnimation;
    const style = selected.style || navigationState.style;

    if (applyAnimation) {
      optionals.applyAnimation = applyAnimation;
    } else {
      let duration = selected.duration;
      if (duration === null || duration === undefined) duration = navigationState.duration;
      if (duration !== null && duration !== undefined) {
        optionals.applyAnimation = (pos, navState) => {
          if (duration === 0) {
            pos.setValue(navState.index);
          } else {
            Animated.timing(pos, { toValue: navState.index, duration }).start();
          }
        };
      }
    }

    // console.log(`NavigationAnimatedView for ${navigationState.key}`);

    // return (
    //   <NavigationAnimatedView
    //     navigationState={navigationState}
    //     style={[styles.animatedView, style]}
    //     renderOverlay={this.renderHeader}
    //     renderScene={this.renderCard}
    //     {...optionals}
    //   />
    // );

    return (
      <CardStack
        navigationState={navigationState}
        style={[styles.animatedView, style]}
        renderOverlay={this.renderHeader}
        onNavigateBack={this.props.onNavigate}
        renderScene={this.renderScene}
        {...optionals}
      />
    );
  }


}
