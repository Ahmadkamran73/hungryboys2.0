import React from "react";
import "../styles/MenuItemCard.css";

class MenuItemCard extends React.Component {
  state = {
    hovered: false,
    quantity: 0,
  };

  toggleHover = (hovered) => this.setState({ hovered });

  increment = () => {
    this.setState((prev) => ({ quantity: prev.quantity + 1 }));
  };

  decrement = () => {
    this.setState((prev) => ({
      quantity: Math.max(prev.quantity - 1, 0),
    }));
  };

  render() {
    const { name, price, description } = this.props;
    const { hovered, quantity } = this.state;

    return (
      <div
        className={`menu-card ${hovered ? "hovered" : ""}`}
        onMouseEnter={() => this.toggleHover(true)}
        onMouseLeave={() => this.toggleHover(false)}
      >
        <h5 className="menu-title">{name}</h5>
        <p className="menu-desc">{description}</p>
        <div className="menu-price">Rs {price}</div>

        <div className="menu-cart-section">
          {quantity > 0 ? (
            <>
              <button className="menu-counter-btn" onClick={this.decrement}>
                -
              </button>
              <span>{quantity}</span>
              <button className="menu-counter-btn" onClick={this.increment}>
                +
              </button>
            </>
          ) : (
            <button className="menu-add-btn" onClick={this.increment}>
              + Add to Bucket
            </button>
          )}
        </div>
      </div>
    );
  }
}

export default MenuItemCard;
