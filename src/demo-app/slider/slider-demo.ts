/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, OnInit, ViewChild, ViewEncapsulation, AfterViewInit} from '@angular/core';
import { MatSlider } from '@angular/material/slider';


@Component({
  moduleId: module.id,
  selector: 'slider-demo',
  templateUrl: 'slider-demo.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false,
})
export class SliderDemo implements OnInit, AfterViewInit {
  demo: number;
  val: number = 50;
  min: number = 0;
  max: number = 100;
  disabledValue = 0;

  @ViewChild('testSlider') testSlider;
  
  ngAfterViewInit() {
    if (this.testSlider != null) {
      setInterval(() => {
        this.testSlider.value += 0.01;
        if (this.testSlider.value > 1) {
          this.testSlider.value = 0;
        }
      }, 30);
    }
  }

  ngOnInit() {}
}
