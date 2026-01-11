import { useState } from "react";

export default function Counter() {

    const [count, setCount] = useState(10);

    return (
        <div>
        <p>Számláló: {count}</p>
        <button onClick={() => setCount(count + 5)}>Katt</button>
        <button onClick={() => setCount(0)}>Nulláz</button>
        </div>
    );

}