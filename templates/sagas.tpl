import { select, call, delay, put, takeEvery, takeLatest, take, all,  } from 'redux-saga/effects';

function sagaRegistrationLog(name, actionType)
{
    console.log("Registering saga " + name + " on " + actionType);
}

export default function* rootSaga()
{
    yield all([
    ]);
}