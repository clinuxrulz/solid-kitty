// A1(t) = (P2(t) - P1(t)) / sqrt((P2(t) - P1(t)).(P2(t) - P1(t)))^3 + (P3(t) - P1(t)) / sqrt((P3(t) - P1(t)).(P3(t) - P1(t)))^3
// A1(t)^2 = (P2(t) - P1(t))^2 / ((P2(t) - P1(t)).(P2(t) - P1(t)))^3 + (P3(t) - P1(t))^2 / ((P3(t) - P1(t)).(P3(t) - P1(t)))^3 + 2*(P2(t) - P1(t))*(P3(t) - P1(t)) / (sqrt((P2(t) - P1(t)).(P2(t) - P1(t)))^3*sqrt((P3(t) - P1(t)).(P3(t) - P1(t)))^3)
// let Q = P2(t) - P1(t)
// let R = P3(t) - P1(t)
// A1(t)^2 = Q^2 / (Q.Q)^3 + R^2 / (R.R)^3 + 2*Q*R / (sqrt(Q.Q)^3*sqrt(R.R)^3)
// 2*Q*R / (sqrt(Q.Q)^3*sqrt(R.R)^3) = A1(t)^2 - Q^2 / (Q.Q)^3 - R^2 / (R.R)^3
// sqrt(Q.Q)^3*sqrt(R.R)^3 = 2*Q*R / (A1(t)^2 - Q^2 / (Q.Q)^3 - R^2 / (R.R)^3)
// (Q.Q)^3*(R.R)^3 = (2*Q*R)^2 / ((A1(t)^2 - Q^2 / (Q.Q)^3 - R^2 / (R.R)^3))^2
// (Q.Q)^3*(R.R)^3*((A1(t)^2 - Q^2 / (Q.Q)^3 - R^2 / (R.R)^3))^2 = (2*Q*R)^2
// (Q.Q)^3*(R.R)^3*(A1(t)^2*(Q.Q)^3*(R.R)^3 - Q^2*(R.R)^3 - R^2*(Q.Q)^3)^2/((Q.Q)^6*(R.R)^6) = (2*Q*R)^2
// (A1(t)^2*(Q.Q)^3*(R.R)^3 - Q^2*(R.R)^3 - R^2*(Q.Q)^3)^2/((Q.Q)^3*(R.R)^3) = (2*Q*R)^2
// (A1(t)^2*(Q.Q)^3*(R.R)^3 - Q^2*(R.R)^3 - R^2*(Q.Q)^3)^2 = (2*Q*R)^2*(Q.Q)^3*(R.R)^3
// (A1(t)^2*(Q.Q)^3*(R.R)^3 - Q^2*(R.R)^3 - R^2*(Q.Q)^3)^2 - (2*Q*R)^2*(Q.Q)^3*(R.R)^3 = 0
// energy = (A1(t)^2*(Q.Q)^3*(R.R)^3 - Q^2*(R.R)^3 - R^2*(Q.Q)^3)^2 - (2*Q*R)^2*(Q.Q)^3*(R.R)^3

import { Component } from "solid-js";

const ThreeBody: Component = () => {
    return undefined;
};

export default ThreeBody;
