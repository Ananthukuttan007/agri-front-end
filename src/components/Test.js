import React, { useState, } from 'react';
import axios from 'axios';
import './Test.css';

function Test() {
    const [dayOfStudy, setdayOfStudy] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [questions, setQuestions] = useState([]);


    const fetchQuestions = async (e) => {
        try {
            const apiKey = 'AIzaSyCQJk7K3ER8zNL0hCeKG9VvSoado5Y8Dl0';

            // Replace 'SHEET_ID' with the ID of your Google Sheet
            const sheetId = '1ToqGeHnaE60O68uP5xin0Rf2cWuowQ2-kOQaRh6CL04';

            // Replace 'RANGE' with the range of data you want to fetch (e.g., 'Sheet1!A1:B10')
            const range = 'Sheet1';
            const response = await axios.get(
                `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?alt=json&key=${apiKey}`
            );
            const rawData = response.data.values;
            const headers = rawData[0]; // First row contains parameter names
            const jsonData = rawData.slice(1).map(row => {
                const rowData = {};
                headers.forEach((header, index) => {
                    rowData[header] = row[index];
                });
                return rowData;
            });
            // Sort the data based on the "Number of attempts" field in ascending order
            jsonData.sort((a, b) => a['Number of attempts'] - b['Number of attempts']);
            const updatedData = await Promise.all(
                jsonData.filter(obj => parseInt(obj.Day) === dayOfStudy).map(async (question) => {
                    console.log(question);
                    // Extract the question and answer from the fetched data
                    const { Question, Answer } = question;
                    const optionIndex = ['a)', 'b)', 'c)', 'd)'];
                    const randomIndex = Math.floor(Math.random() * optionIndex.length);
                    const randomOption = optionIndex[randomIndex];
                    const queryData = { content: `${Question}   ${randomOption} ${Answer} Create three wrong options for this and return only those options without any explanations, introduction, or conclusion sentence.` }
                    const wrongOptions = await postDataToChatEndpoint(queryData);
                    const options = [Answer, ...wrongOptions];
                    shuffleArray(options);
                    return {
                        ...question,
                        options,
                    };
                })
            );
            setQuestions(updatedData);
        } catch (error) {
            console.error('Error fetching questions:', error);
        }
    };


    const postDataToChatEndpoint = async (dataToSend) => {

        try {
            const response = await axios.post('https://agribackendlearning-anantharaghunath.b4a.run/chat', dataToSend);
            return (extractContentWithoutOptions(response.data));
            // Process the response from the server here
        } catch (error) {
            console.error('Error:', error);
        }
    };

    function extractOptions(text) {
        // Define a regular expression to match the options
        const regex = /(?:^[a-zA-Z]+\)|^\d+\.|\*\s*)(.*?)(?=\n|$)/gm;

        // Array to store the extracted options
        const options = [];

        // Extract options using the regular expression
        const matches = text.match(regex);
        if (matches) {
            for (const match of matches) {
                // Extract the option text and remove the option label (e.g., a), b), 1., *, etc.)
                const optionText = match.replace(/^[a-zA-Z]+\)|^\d+\.|\*\s*|\n/g, '').trim();

                // Skip the option if it's empty
                if (optionText !== '') {
                    options.push(optionText);
                }
            }
        }

        return options;
    }

    function extractContentWithoutOptions(data) {
        if (!data || !Array.isArray(data)) {
            return [];
        }

        const extractedContent = data.map((item) => {
            if (item && item.candidates && Array.isArray(item.candidates) && item.candidates.length > 0) {
                // Extract content from the candidates object and remove options (a), (b), or (c)
                console.log(item.candidates[0].content);
                const content = extractOptions(item.candidates[0].content);
                return content;
            }
            return null;
        });

        // Filter out null values
        return extractedContent.filter((content) => content !== null)[0];
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
        }
    }


    const handledayOfStudyChange = (e) => {
        const count = parseInt(e.target.value);
        setdayOfStudy(count);
    };

    const handlePrevQuestion = () => {
        setCurrentQuestion((prevQuestion) => prevQuestion - 1);
    };

    const handleNextQuestion = () => {
        setCurrentQuestion((prevQuestion) => prevQuestion + 1);
    };

    const [result, setResult] = useState(null); // Holds the result of each question (correct, wrong, or not attempted)

    const handleOptionChange = (e) => {
        const { value } = e.target;
        const updatedSelectedOptions = [...selectedOptions];
        updatedSelectedOptions[currentQuestion] = value;
        setSelectedOptions(updatedSelectedOptions);

        // Clear the result when user changes the selected option
        setResult(null);
    };

    const handleSubmit = async () => {
        // Calculate the results after submission
        const updatedResult = questions.map((question, index) => {
            const attemptedOption = selectedOptions[index];
            const correctOption = question.Answer;

            if (attemptedOption === correctOption) {
                return 'correct';
            } else if (attemptedOption) {
                return 'wrong';
            } else {
                return 'not-attempted';
            }
        });

        setResult(updatedResult);
    };
    return (
        <div className="App">
            <div>
                <label htmlFor="dayOfStudy">Which day's questions do you want to attempt?</label>
                <input
                    type="number"
                    id="dayOfStudy"
                    value={dayOfStudy}
                    onChange={handledayOfStudyChange}
                />
            </div>

            {questions.length <= 0 && (
                <button onClick={fetchQuestions}>Generate Questions</button>
            )}

            {questions.length > 0 && (
                <div>
                    <h3>Question {currentQuestion + 1} of {questions.length}</h3>
                    <p>{questions[currentQuestion].Question}</p>
                    <form>
                        {questions[currentQuestion].options.map((option, index) => {
                            const isSelectedOption = selectedOptions[currentQuestion] === option;
                            const isCorrectOption = questions[currentQuestion].Answer === option;
                            const isCurrentQuestionSubmitted = result && result[currentQuestion];
                            const isAttemptCorrect = isSelectedOption === isCorrectOption

                            let icon = null;
                            let optionClassName = '';

                            if (isSelectedOption && isCurrentQuestionSubmitted) {
                                if (isCorrectOption) {
                                    icon = '✓'; // Tick icon for correct option
                                    optionClassName = 'correct';
                                } else {
                                    icon = '✗'; // Cross icon for wrong option
                                    optionClassName = 'wrong';
                                }
                            }
                            let bgcolor = 'white';
                            if (!isAttemptCorrect && isCurrentQuestionSubmitted) {
                                if (isCorrectOption) {
                                    icon = '✓'; // Tick icon for correct option
                                    optionClassName = 'correct';
                                    bgcolor = '#c1e1c1';
                                }
                                if (isSelectedOption) {
                                    icon = '✗'; // Cross icon for wrong option
                                    optionClassName = 'wrong';
                                    bgcolor = '#f3d3d9';
                                }
                            } else {
                                if (isCorrectOption && isCurrentQuestionSubmitted) {
                                    icon = '✓'; // Tick icon for correct option
                                    optionClassName = 'correct';
                                    bgcolor = '#c1e1c1';
                                }
                            }

                            return (
                                <div key={index} className={optionClassName} style={{ background: bgcolor }}>
                                    {!isCurrentQuestionSubmitted && (<input
                                        type="radio"
                                        name={`question_${currentQuestion}`}
                                        value={option}
                                        checked={isSelectedOption}
                                        onChange={handleOptionChange}
                                    />)}
                                    <label htmlFor={`option${index}`}>
                                        {option} {icon && <span>{icon}</span>}
                                    </label>
                                </div>
                            );
                        })}
                    </form>

                    {currentQuestion > 0 && (
                        <button onClick={handlePrevQuestion}>Previous Question</button>
                    )}

                    {currentQuestion < questions.length - 1 && (
                        <button onClick={handleNextQuestion}>Next Question</button>
                    )}
                </div>
            )}
            {currentQuestion === questions.length - 1 && (
                <button style={{ background: "green", color: "white" }} onClick={handleSubmit}>Submit</button>
            )}
        </div>
    );
}

export default Test;
