import { Card, Badge } from 'react-bootstrap';
import { getImageUrl } from '../API.mjs';

const GameCard = ({ 
  card, 
  size = 'medium', 
  showMisfortuneIndex = true,
  showImageAuthor = false,
  onClick,
  className = '',
  style = {},
  imageStyle = {},
  bodyClassName = '',
  titleClassName = ''
}) => {
  if (!card) return null;

  // Size configurations
  const sizeConfig = {
    medium: { // Default size
      cardWidth: '180px',
      cardHeight: '200px',
      imageHeight: '120px',
      titleSize: '12px',
      bodyPadding: 'p-2'
    },
    large: { // Used for the Round Card during a game
      cardWidth: '250px',
      cardHeight: '300px',
      imageHeight: '200px',
      titleSize: '14px',
      bodyPadding: 'p-3'
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Combine styles
  const cardStyle = {
    width: config.cardWidth,
    height: config.cardHeight,
    ...style
  };

  const finalImageStyle = {
    height: config.imageHeight,
    objectFit: 'cover',
    ...imageStyle
  };

  const titleStyle = {
    fontSize: config.titleSize,
    lineHeight: '1.2',
    ...titleClassName && {}
  };

  return (
    <Card 
      className={className}
      style={cardStyle}
      onClick={onClick}
    >
      <Card.Img 
        variant="top" 
        src={getImageUrl(card.image_url)}
        alt={card.name}
        style={finalImageStyle}
        title={onClick ? "Click to view full image" : card.name}
      />
      <Card.Body className={`${config.bodyPadding} ${bodyClassName} d-flex flex-column`}>
        <Card.Title 
          className={`mb-1 ${titleClassName}`}
          style={titleStyle}
        >
          {card.name}
        </Card.Title>
        
        {showMisfortuneIndex && (
          <div className="mb-1">
            <Badge bg="primary" className="me-1">
              Index: {card.misfortune_index || 'N/A'}
            </Badge>
          </div>
        )}
        
        {showImageAuthor && (
          <div className="mt-auto" style={{ fontSize: '11px' }}>
            <strong>Image by:</strong> {card.image_author || 'Unknown'}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default GameCard;
