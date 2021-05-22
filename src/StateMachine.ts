export default class StateMachine<StateType> {
  currentState: StateType;
  transitions: Array<Transition<StateType>> = [];
  constructor(initialState: StateType) {
    this.currentState = initialState;
  };

  addTransition(start: StateType, end: StateType, callback: Function) {
    this.transitions.push(new Transition(start, end, callback));
  }

  transition(targetState: StateType) {
    const transition = this.transitions.find(t => t.startState === this.currentState && t.endState === targetState);
    if (transition) {
      transition.callback();
      this.currentState = targetState;
    } else {
      console.error(`Invalid state transition ${this.currentState} to ${targetState}`);
    }
  }
};

class Transition<StateType> {
  constructor(readonly startState: StateType, readonly endState: StateType, readonly callback: Function) {}
}