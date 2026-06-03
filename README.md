# Double Pendulum Simulation

A real-time, energy-conserving simulation of chaotic double pendulum dynamics using fourth-order Runge–Kutta integration and GPU rendering.

Link to simulation: 
[magilab.github.io/double-pendulum](https://magilab.github.io/double-pendulum)
## Personal Background
This project grew out of a desire to understand how deterministic systems generate chaotic outcomes. I derived the equations of motion from first principles using Lagrangian mechanics and implemented the numerical integration and rendering pipeline in WebGL to explore both the physics and computational aspects of nonlinear dynamics.

## Physics/Math
This system consists of a planar double pendulum with two point masses $m_1$, $m_2$ attached by rigid, massless rods of length $l_1$, $l_2$, moving under gravity with no damping forces present. Below is a brief summary of the quantitative physics and math required for this simulation.

Using the following diagram:  
  
![Double Pendulum Diagram](DoublePendulum.svg)  
We can thus derive the following equations using trigonometry, where $\theta_1\$, $\theta_2\$ are the angles between each rod and the y-axis:

$x_1=l_1sin\Theta_1$

$y_1=-l_1cos\Theta_1$

$x_2=l_1sin\Theta_1+l_2sin\Theta_2$

$y_2=-l_1cos\Theta_1-l_2cos\Theta_2$

These are the displacement equations for bobs (point masses) 1 & 2; the velocity equations (for the x and y components of each bob's velocity) are hence found by deriving each with respect to time. The true velocity of each bob can thus be found using Pythagoras, and used to find the Lagrange via $L=T-V$ (Lagrange = Kinetic Energy - Potential Energy). We can then use the Euler-Lagrange equation:

$\frac{d }{dt}(\frac{\partial L}{\partial \dot{\Theta}_i})=\frac{\partial L}{\partial \Theta_i}$

to find the equations of motion of the double pendulum by calculating the required derivatives. This yields the following two equations for $\theta_1\$ & $\theta_2\$ respectively:

$l_1^2\ddot{\Theta}_1(m_1+m_2)+m_2l_1l_2\ddot{\Theta}_2cos(\Theta_1-\Theta_2)+m_2l_1l_2\dot{\Theta}_2^2sin(\Theta_1-\Theta_2)+gl_1sin\Theta_1(m_1+m_2)=0$

$m_2l_1l_2\ddot{\Theta}_1cos(\Theta_1-\Theta_2)-m_2l_1l_2\dot{\Theta}_1^2sin(\Theta_1-\Theta_2)+m_2l_2^2\ddot{\Theta}_2+m_2gl_2sin\Theta_2=0$

Now, for Runge-Kutta 4 numerical integration, the system is expressed in first-order form:

$\theta_1\'=\omega_1\$

$\theta_2\'=\omega_2\$

$\omega_1\'=f_1(\theta_1\,\theta_2\,\omega_1\,\omega_2\)$

$\omega_2\'=f_2(\theta_1\,\theta_2\,\omega_1\,\omega_2\)$

## Features
- Real-time RK4 integration of the aforementioned equations of motion
- Adjustable parameters: Mass 1, Mass 2, Length 1, Length 2, Gravity
- Stop/Start/Reset
- Drag bobs to set initial angles
- Toggle real-time energy calculation and display
- Toggle tail (bob 2 path tracer)
- Toggle phase space visualisation ($\frac{da}{dt}$ vs $a$ for $\theta_1\$ & $\theta_2\$)

## Numerical Accuracy & Stability
- RK4 was chosen over Euler and symplectic Euler methods for improved long-term accuracy
- The system is integrated using RK4 with an effective timestep of $h≈3.2×10^{-3}$ at 60FPS, capped at $h≈10^{-2}$ during frame drops via sub-stepping

## Results & Behaviour
The simulation effectively reproduces key qualitative features of the double pendulum:
- Regular, near-periodic motion at low energy states
- Rapid divergence of trajectories from nearby initial conditions
- Wholely chaotic motion at higher energy states

Small deviations in initial angles lead to notably divergent trajectories within seconds, illustrating the sensitive dependence on initial conditions

## Learnings
Throughout this project, I developed:
- An appreciation for the complexity of chaotic systems
- A deeper understanding of Lagrangian mechanics, an interesting contrast to traditional Newtonian mechanics
- Practical experience with nonlinear ODE integration
- Familiarity with the necessary infrastructure to render and optimise results
- Debugging strategies when errors resulted in a lack of any energy conservation
