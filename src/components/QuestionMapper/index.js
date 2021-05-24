import { Component } from "react";
import Question from "../Question";
import "./style.sass";
import { Context } from "../../store";
import key from "../../plugins/key";
import QuestionClassifier from "../../plugins/QuestionClassifier";
import AnswerTreatment from "../../plugins/AnswerTreatment";
import { ParallelContext } from "../../parallelStore";

export default class QuestionMapper extends Component {
  static contextType = Context;

  constructor(props, context) {
    super(props, context);

    const table = this.context.state["database.table"];
    this.titles = (table && table.titles) || [];
    this.state = {
      filters: [
        {
          filter: (i) => i,
          params: {
            question: null,
            answer: "",
          },
        },
      ],
      phrase: [],
    };
  }

  removeFilter = (f) => {
    const filters = this.state.filters.filter(
      (i) =>
        !(
          i.params.question === f.params.question &&
          i.params.answer === f.params.answer
        )
    );
    this.setState({
      filters,
      phrase: this.getPhrase(filters),
    });
  };

  getPhrase = (filters) => {
    return filters.reduce((acc, f) => {
      if (f.params.question === null) {
        return acc;
      }
      return [
        ...acc,
        <span
          onClick={() => this.removeFilter(f)}
          className="c-question-mapper__filter"
          key={key(`${f.params.question}-${f.params.answer}`)}
        >
          {`Q.${f.params.question + 1} answer == "${f.params.answer}"`}
        </span>,
      ];
    }, []);
  };

  onAnswerClick = (question, answer, classification) => {
    const filters = [
      ...this.state.filters,
      {
        filter: (i, question, answer) => {
          if (AnswerTreatment[classification.key]) {
            return AnswerTreatment[classification.key](i[question]) === answer;
          }
          return i[question] === answer;
        },
        params: {
          question,
          answer,
        },
      },
    ];

    this.setState({
      filters,
      phrase: this.getPhrase(filters),
    });
  };

  render() {
    const classifier = new QuestionClassifier();

    return this.titles.length ? (
      <div className="c-question-mapper">
        {this.state.phrase.length ? (
          <p className="c-question-mapper__query">
            {this.state.phrase.map((i) => i)}
          </p>
        ) : (
          ""
        )}
        <div className="c-question-mapper__questions">
          {this.titles.map((item, index) => {
            return (
              <ParallelContext.Consumer key={key(`question-${index}`)}>
                {(parallel) => (
                  <Question
                    parallel={parallel}
                    title={item}
                    position={index}
                    classifier={classifier}
                    onAnswerClick={(i, classification) =>
                      this.onAnswerClick(index, i, classification)
                    }
                    filters={this.state.filters}
                  ></Question>
                )}
              </ParallelContext.Consumer>
            );
          })}
        </div>
      </div>
    ) : (
      <>
        <h1>You don't have a dataset. Please, create one.</h1>
      </>
    );
  }
}
